"""Give a browser-recorded (fragmented) MP4 its real duration, so players show the right length and can seek.

The browser's MediaRecorder writes MP4s in fragments and leaves the total duration as 0, so video
players think the clip is only as long as its first fragment. This script adds up every fragment's
sample durations per track, then writes the totals into mvhd / tkhd / mdhd and adds an `mehd` box.

Usage:  python tools/fix_mp4_duration.py media/trailer.mp4
"""
import struct
import sys

CONTAINERS = {"moov", "trak", "mdia", "minf", "stbl", "mvex", "moof", "traf", "edts", "dinf"}


def walk(buf, start, end):
    i = start
    while i + 8 <= end:
        size, typ = struct.unpack(">I4s", buf[i:i + 8])
        hdr = 8
        if size == 1:
            size = struct.unpack(">Q", buf[i + 8:i + 16])[0]
            hdr = 16
        elif size == 0:
            size = end - i
        yield typ.decode("latin1"), i, size, hdr
        i += size


def children(buf, off, size, hdr):
    return list(walk(buf, off + hdr, off + size))


def find(buf, off, size, hdr, name):
    return [c for c in children(buf, off, size, hdr) if c[0] == name]


def main(path):
    data = bytearray(open(path, "rb").read())
    top = list(walk(data, 0, len(data)))
    moov = next(b for b in top if b[0] == "moov")

    # Track ids, their media timescales, and defaults from trex.
    tracks = {}
    for trak in find(data, *moov[1:], "trak"):
        tkhd = find(data, *trak[1:], "tkhd")[0]
        v = data[tkhd[1] + tkhd[3]]
        tid = struct.unpack(">I", data[tkhd[1] + tkhd[3] + (20 if v == 1 else 12):][:4])[0]
        mdia = find(data, *trak[1:], "mdia")[0]
        mdhd = find(data, *mdia[1:], "mdhd")[0]
        mv = data[mdhd[1] + mdhd[3]]
        ts = struct.unpack(">I", data[mdhd[1] + mdhd[3] + (20 if mv == 1 else 12):][:4])[0]
        tracks[tid] = {"trak": trak, "tkhd": tkhd, "mdhd": mdhd, "timescale": ts, "dur": 0, "default": 0}
    mvex = find(data, *moov[1:], "mvex")[0]
    for trex in find(data, *mvex[1:], "trex"):
        tid, _, ddur = struct.unpack(">III", data[trex[1] + trex[3] + 4:][:12])
        tracks[tid]["default"] = ddur

    # Sum sample durations over every fragment.
    for moof in (b for b in top if b[0] == "moof"):
        for traf in find(data, *moof[1:], "traf"):
            tfhd = find(data, *traf[1:], "tfhd")[0]
            p = tfhd[1] + tfhd[3]
            flags = struct.unpack(">I", data[p:p + 4])[0] & 0xFFFFFF
            tid = struct.unpack(">I", data[p + 4:p + 8])[0]
            q = p + 8
            if flags & 0x01: q += 8
            if flags & 0x02: q += 4
            default = tracks[tid]["default"]
            if flags & 0x08: default = struct.unpack(">I", data[q:q + 4])[0]
            for trun in find(data, *traf[1:], "trun"):
                r = trun[1] + trun[3]
                tflags = struct.unpack(">I", data[r:r + 4])[0] & 0xFFFFFF
                count = struct.unpack(">I", data[r + 4:r + 8])[0]
                r += 8
                if tflags & 0x001: r += 4
                if tflags & 0x004: r += 4
                per = 4 * sum(bool(tflags & f) for f in (0x100, 0x200, 0x400, 0x800))
                if tflags & 0x100:
                    for k in range(count):
                        tracks[tid]["dur"] += struct.unpack(">I", data[r + k * per:r + k * per + 4])[0]
                else:
                    tracks[tid]["dur"] += default * count

    mvhd = find(data, *moov[1:], "mvhd")[0]
    mp = mvhd[1] + mvhd[3]
    mv = data[mp]
    movie_ts = struct.unpack(">I", data[mp + (20 if mv == 1 else 12):][:4])[0]
    movie_dur = max(round(t["dur"] * movie_ts / t["timescale"]) for t in tracks.values())

    def put_dur(box, offset_v0, offset_v1, value):
        b = box[1] + box[3]
        if data[b] == 1: data[b + offset_v1:b + offset_v1 + 8] = struct.pack(">Q", value)
        else: data[b + offset_v0:b + offset_v0 + 4] = struct.pack(">I", value)

    put_dur(mvhd, 16, 24, movie_dur)
    for t in tracks.values():
        put_dur(t["tkhd"], 20, 28, round(t["dur"] * movie_ts / t["timescale"]))
        put_dur(t["mdhd"], 16, 24, t["dur"])

    # Add (or update) mehd = total fragment duration, then grow mvex and moov to fit it.
    mehd = find(data, *mvex[1:], "mehd")
    if mehd:
        put_dur(mehd[0], 4, 4, movie_dur)
    else:
        box = struct.pack(">I4sIQ", 20, b"mehd", 0x01000000, movie_dur)
        at = mvex[1] + mvex[3]
        data[at:at] = box
        for b in (mvex, moov):
            data[b[1]:b[1] + 4] = struct.pack(">I", struct.unpack(">I", data[b[1]:b[1] + 4])[0] + len(box))

    open(path, "wb").write(data)
    for tid, t in tracks.items():
        print(f"track {tid}: {t['dur'] / t['timescale']:.2f}s")
    print(f"movie duration set to {movie_dur / movie_ts:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1])
