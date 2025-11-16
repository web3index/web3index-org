/* eslint-disable */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Imperative helper that wraps a DOM node with retro "screen" visual effects.
 * Used for marketing pages; not intended for general consumption.
 */
export default class ScreenEffect {
  constructor(parent, options) {
    this.parent = parent;
    if (typeof parent === "string") {
      this.parent = document.querySelector(parent);
    }

    this.config = Object.assign(
      {},
      {
        //
      },
      options,
    );

    this.effects = {};

    this.events = {
      resize: this.onResize.bind(this),
    };

    window.addEventListener("resize", this.events.resize, false);

    this.render();
  }

  render() {
    const container = document.createElement("div");
    container.classList.add("screen-container");

    const wrapper1 = document.createElement("div");
    wrapper1.classList.add("screen-wrapper");

    const wrapper2 = document.createElement("div");
    wrapper2.classList.add("screen-wrapper");

    const wrapper3 = document.createElement("div");
    wrapper3.classList.add("screen-wrapper");

    wrapper1.appendChild(wrapper2);
    wrapper2.appendChild(wrapper3);

    container.appendChild(wrapper1);

    this.parent.parentNode.insertBefore(container, this.parent);
    wrapper3.appendChild(this.parent);

    this.nodes = { container, wrapper1, wrapper2, wrapper3 };

    this.onResize();
  }

  onResize(e) {
    this.rect = this.parent.getBoundingClientRect();

    if (this.effects.vcr && !!this.effects.vcr.enabled) {
      this.generateVCRNoise();
    }
  }

  add(type, options) {
    const config = Object.assign(
      {},
      {
        fps: 30,
        blur: 1,
      },
      options,
    );

    if (Array.isArray(type)) {
      for (const t of type) {
        this.add(t);
      }

      return this;
    }

    const that = this;

    if (type === "snow") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.classList.add(type);
      canvas.width = this.rect.width / 2;
      canvas.height = this.rect.height / 2;

      this.nodes.wrapper2.appendChild(canvas);

      animate();
      // that.generateSnow(ctx);

      function animate() {
        that.generateSnow(ctx);
        that.snowframe = requestAnimationFrame(animate);
      }

      this.effects[type] = {
        wrapper: this.nodes.wrapper2,
        node: canvas,
        enabled: true,
        config,
      };

      return this;
    }

    if (type === "roll") {
      return this.enableRoll();
    }

    if (type === "vcr") {
      const canvas = document.createElement("canvas");
      canvas.classList.add(type);
      this.nodes.wrapper2.appendChild(canvas);

      canvas.width = this.rect.width;
      canvas.height = this.rect.height;

      this.effects[type] = {
        wrapper: this.nodes.wrapper2,
        node: canvas,
        ctx: canvas.getContext("2d"),
        enabled: true,
        config,
      };

      this.generateVCRNoise();

      return this;
    }

    let node = false;
    let wrapper = this.nodes.wrapper2;

    switch (type) {
      case "wobblex":
      case "wobbley":
        wrapper.classList.add(type);
        break;
      case "scanlines":
        node = document.createElement("div");
        node.classList.add(type);
        wrapper.appendChild(node);
        break;
      case "vignette":
        wrapper = this.nodes.container;
        node = document.createElement("div");
        node.classList.add(type);
        wrapper.appendChild(node);
        break;
      case "image":
        wrapper = this.parent;
        node = document.createElement("img");
        node.classList.add(type);

        node.src = config.src;

        wrapper.appendChild(node);
        break;
      case "video":
        wrapper = this.parent;
        node = document.createElement("video");
        node.classList.add(type);

        node.src = config.src;
        node.crossOrigin = "anonymous";
        node.autoplay = true;
        node.muted = true;
        node.loop = true;
        wrapper.appendChild(node);
        break;
    }

    this.effects[type] = {
      wrapper,
      node,
      enabled: true,
      config,
    };

    return this;
  }

  remove(type) {
    const obj = this.effects[type];
    if (type in this.effects && !!obj.enabled) {
      obj.enabled = false;

      if (type === "roll" && obj.original) {
        this.parent.appendChild(obj.original);
      }

      if (type === "vcr") {
        clearInterval(this.vcrInterval);
      }

      if (type === "snow") {
        cancelAnimationFrame(this.snowframe);
      }

      if (obj.node) {
        obj.wrapper.removeChild(obj.node);
      } else {
        obj.wrapper.classList.remove(type);
      }
    }

    return this;
  }

  enableRoll() {
    const el = this.parent.firstElementChild;

    if (el) {
      const div = document.createElement("div");
      div.classList.add("roller");

      this.parent.appendChild(div);
      div.appendChild(el);
      div.appendChild(el.cloneNode(true));

      // if ( this.effects.vcr.enabled ) {
      // 	div.appendChild(this.effects.vcr.node);
      // }

      this.effects.roll = {
        enabled: true,
        wrapper: this.parent,
        node: div,
        original: el,
      };
    }
  }

  generateVCRNoise() {
    const canvas = this.effects.vcr.node;
    const config = this.effects.vcr.config;
    const div = this.effects.vcr.node;

    if (config.fps >= 60) {
      cancelAnimationFrame(this.vcrInterval);
      const animate = () => {
        this.renderTrackingNoise();
        this.vcrInterval = requestAnimationFrame(animate);
      };

      animate();
    } else {
      clearInterval(this.vcrInterval);
      this.vcrInterval = setInterval(() => {
        this.renderTrackingNoise();
      }, 1000 / config.fps);
    }
  }

  // Generate CRT noise
  generateSnow(ctx) {
    var w = ctx.canvas.width,
      h = ctx.canvas.height,
      d = ctx.createImageData(w, h),
      b = new Uint32Array(d.data.buffer),
      len = b.length;

    for (var i = 0; i < len; i++) {
      b[i] = ((255 * Math.random()) | 0) << 24;
    }

    ctx.putImageData(d, 0, 0);
  }

  renderTrackingNoise(radius = 2, xmax, ymax) {
    const canvas = this.effects.vcr.node;
    const ctx = this.effects.vcr.ctx;
    const config = this.effects.vcr.config;
    let posy1 = config.miny || 0;
    let posy2 = config.maxy || canvas.height;
    let posy3 = config.miny2 || 0;
    const num = config.num || 20;

    if (xmax === undefined) {
      xmax = canvas.width;
    }

    if (ymax === undefined) {
      ymax = canvas.height;
    }

    canvas.style.filter = `blur(${config.blur}px)`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `#fff`;

    ctx.beginPath();
    for (var i = 0; i <= num; i++) {
      var x = Math.random(i) * xmax;
      var y1 = getRandomInt((posy1 += 3), posy2);
      var y2 = getRandomInt(0, (posy3 -= 3));
      ctx.fillRect(x, y1, radius, radius);
      ctx.fillRect(x, y2, radius, radius);
      ctx.fill();

      this.renderTail(ctx, x, y1, radius);
      this.renderTail(ctx, x, y2, radius);
    }
    ctx.closePath();
  }

  renderTail(ctx, x, y, radius) {
    const n = getRandomInt(1, 50);

    const dirs = [1, -1];
    let rd = radius;
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    for (let i = 0; i < n; i++) {
      const step = 0.01;
      let r = getRandomInt((rd -= step), radius);
      let dx = getRandomInt(1, 4);

      radius -= 0.1;

      dx *= dir;

      ctx.fillRect((x += dx), y, r, r);
      ctx.fill();
    }
  }
}
