# Graphic Relief Native Prototype

This is a standalone C++ benchmark for the SCD graphic relief geometry core.
It does not integrate with Illustrator yet. It measures the native version of:

- polygon segment construction
- X/Y bucket indexing
- line-to-shape interval lookup
- relief sampling point generation

Build:

```powershell
cmake -S tools/graphic-relief-native -B tools/graphic-relief-native/build -DCMAKE_BUILD_TYPE=Release
cmake --build tools/graphic-relief-native/build --config Release
```

Run:

```powershell
tools/graphic-relief-native/build/Release/graphic_relief_bench.exe 12 160 96 200
```

Arguments:

1. glyph count
2. vertices per glyph-like polygon
3. line rows
4. benchmark iterations

Next integration options:

- Native helper executable called by the CEP panel for geometry calculation.
- Full Illustrator SDK `.aip` plugin if file-system helper calls are not acceptable.
