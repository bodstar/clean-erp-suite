/**
 * Custom Leaflet 1.x–compatible heat layer using simpleheat.
 * Replaces the broken leaflet.heat npm package which uses legacy Leaflet 0.x APIs.
 */
import L from "leaflet";
import simpleheat from "simpleheat";

interface HeatLayerOptions extends L.LayerOptions {
  minOpacity?: number;
  maxZoom?: number;
  max?: number;
  radius?: number;
  blur?: number;
  gradient?: Record<number, string>;
}

class HeatLayer extends L.Layer {
  private _latlngs: [number, number, number?][];
  private _canvas: HTMLCanvasElement | null = null;
  private _heat: ReturnType<typeof simpleheat> | null = null;
  private _frame: number | null = null;

  declare options: HeatLayerOptions;

  constructor(latlngs: [number, number, number?][], options?: HeatLayerOptions) {
    super(options);
    this._latlngs = latlngs;
    L.Util.setOptions(this, options);
  }

  onAdd(map: L.Map): this {
    this._initCanvas();
    const pane = this.getPane();
    if (pane && this._canvas) {
      pane.appendChild(this._canvas);
    }

    map.on("moveend", this._reset, this);
    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on("zoomanim", this._animateZoom, this);
    }
    this._reset();
    return this;
  }

  onRemove(map: L.Map): this {
    const pane = this.getPane();
    if (pane && this._canvas) {
      pane.removeChild(this._canvas);
    }
    map.off("moveend", this._reset, this);
    if (map.options.zoomAnimation) {
      map.off("zoomanim", this._animateZoom, this);
    }
    return this;
  }

  private _initCanvas() {
    const canvas = (this._canvas = L.DomUtil.create(
      "canvas",
      "leaflet-heatmap-layer leaflet-layer"
    ) as HTMLCanvasElement);

    const originProp = L.DomUtil.testProp([
      "transformOrigin",
      "WebkitTransformOrigin",
      "msTransformOrigin",
    ]);
    if (originProp) {
      (canvas.style as any)[originProp] = "50% 50%";
    }

    const map = this._map;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const animated = map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(
      canvas,
      "leaflet-zoom-" + (animated ? "animated" : "hide")
    );

    this._heat = simpleheat(canvas);
    this._updateOptions();
  }

  private _updateOptions() {
    if (!this._heat) return;
    this._heat.radius(
      this.options.radius || this._heat.defaultRadius,
      this.options.blur
    );
    if (this.options.gradient) {
      this._heat.gradient(this.options.gradient);
    }
    if (this.options.max) {
      this._heat.max(this.options.max);
    }
  }

  private _reset() {
    if (!this._map || !this._canvas || !this._heat) return;
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    const size = this._map.getSize();
    if (this._canvas.width !== size.x) {
      this._canvas.width = size.x;
    }
    if (this._canvas.height !== size.y) {
      this._canvas.height = size.y;
    }
    this._redraw();
  }

  private _redraw() {
    if (!this._map || !this._heat) return;

    const data: [number, number, number][] = [];
    const r = this._heat._r;
    const size = this._map.getSize();
    const bounds = new L.Bounds(L.point([-r, -r]), size.add([r, r]));

    const max =
      this.options.max === undefined ? 1 : this.options.max;
    const maxZoom =
      this.options.maxZoom === undefined
        ? this._map.getMaxZoom()
        : this.options.maxZoom;
    const v =
      1 /
      Math.pow(
        2,
        Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12))
      );
    const cellSize = r / 2;
    const grid: ([number, number, number] | undefined)[][] = [];

    for (let i = 0; i < this._latlngs.length; i++) {
      const p = this._map.latLngToContainerPoint(this._latlngs[i] as [number, number]);
      if (bounds.contains(p)) {
        const x = Math.floor(p.x / cellSize) + 2;
        const y = Math.floor(p.y / cellSize) + 2;

        const alt =
          this._latlngs[i][2] !== undefined ? +this._latlngs[i][2]! : 1;
        const k = alt * v;

        grid[y] = grid[y] || [];
        const cell = grid[y][x];

        if (!cell) {
          grid[y][x] = [p.x, p.y, k];
        } else {
          cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k);
          cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k);
          cell[2] += k;
        }
      }
    }

    const result: [number, number, number][] = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        for (let j = 0; j < grid[i].length; j++) {
          const cell = grid[i][j];
          if (cell) {
            result.push([
              Math.round(cell[0]),
              Math.round(cell[1]),
              Math.min(cell[2], max),
            ]);
          }
        }
      }
    }

    this._heat.data(result).draw(this.options.minOpacity);
    this._frame = null;
  }

  private _animateZoom(e: L.ZoomAnimEvent) {
    if (!this._map || !this._canvas) return;
    const scale = this._map.getZoomScale(e.zoom);
    const mapAny = this._map as any;
    const offset = mapAny
      ._getCenterOffset(e.center)
      ._multiplyBy(-scale)
      .subtract(mapAny._getMapPanePos());

    L.DomUtil.setTransform(this._canvas, offset, scale);
  }
}

export function createHeatLayer(
  latlngs: [number, number, number?][],
  options?: HeatLayerOptions
): L.Layer {
  return new HeatLayer(latlngs, options);
}
