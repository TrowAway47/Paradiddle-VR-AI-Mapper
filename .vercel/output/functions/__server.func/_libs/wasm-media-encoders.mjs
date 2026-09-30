import { n as _object_spread, r as _define_property, t as _object_spread_props } from "./swc__helpers.mjs";
//#region node_modules/wasm-media-encoders/dist/es/index.mjs
var g = {
	mimeType: "audio/mpeg",
	parseParams: function(A) {
		var C, Q, g;
		switch (A.bitrate) {
			case void 0:
			case 8:
			case 16:
			case 24:
			case 32:
			case 40:
			case 48:
			case 64:
			case 80:
			case 96:
			case 112:
			case 128:
			case 160:
			case 192:
			case 224:
			case 256:
			case 320: break;
			default: throw Error("Invalid constant bitrate ".concat(A.bitrate));
		}
		switch (A.outputSampleRate) {
			case void 0:
			case 8e3:
			case 11025:
			case 12e3:
			case 16e3:
			case 22050:
			case 24e3:
			case 32e3:
			case 44100:
			case 48e3: break;
			default: throw Error("Invalid output sample rate ".concat(A.outputSampleRate));
		}
		if (void 0 !== A.vbrQuality && (A.vbrQuality < 0 || A.vbrQuality >= 10)) throw Error("Invalid VBR quality: ".concat(A.vbrQuality));
		let D = /* @__PURE__ */ new Int32Array(3);
		return D[0] = null !== (C = A.bitrate) && void 0 !== C ? C : 0, new Float32Array(D.buffer)[1] = null !== (Q = A.vbrQuality) && void 0 !== Q ? Q : void 0 !== A.bitrate ? -1 : 4, D[2] = null !== (g = A.outputSampleRate) && void 0 !== g ? g : 0, D;
	}
};
var D = {
	mimeType: "audio/ogg",
	parseParams: function(A) {
		var C;
		let Q = null !== (C = A.vbrQuality) && void 0 !== C ? C : 3, g = void 0 !== A.oggSerialNo ? Math.min(Math.max(Math.floor(A.oggSerialNo), -2147483648), 2147483647) : Math.floor(4294967296 * Math.random()) + -2147483648;
		if (Q < -1 || Q > 10) throw Error("Invalid VBR quality ".concat(Q));
		let D = /* @__PURE__ */ new Int32Array(2);
		return new Float32Array(D.buffer)[0] = Q, D[1] = g, D;
	}
};
async function w(A) {
	let g = {
		wasi_snapshot_preview1: { proc_exit: (A) => {
			throw Error("fatal error exit(".concat(A, ")"));
		} },
		env: { emscripten_notify_memory_growth: () => {} }
	};
	"string" != typeof A || WebAssembly.instantiateStreaming || (A = "undefined" == typeof fetch ? await function(A) {
		let C = A.split(",");
		if (2 !== C.length || !1 === /^data:application\/(octet-stream|wasm);base64$/.test(C[0])) throw Error("Passed non-data URI");
		return Buffer.from(C[1], "base64");
	}(A) : await (await fetch(A)).arrayBuffer());
	let D = await ("string" == typeof A ? WebAssembly.instantiateStreaming(fetch(A), g) : WebAssembly.instantiate(A, g)), w = _object_spread_props(_object_spread({}, (D.instance || D).exports), {
		module: D.module || A,
		getInt32Array(A, C) {
			return new Int32Array(this.memory.buffer, A, C);
		},
		getFloat32Array(A, C) {
			return new Float32Array(this.memory.buffer, A, C);
		},
		getUint8Array(A, C) {
			return new Uint8Array(this.memory.buffer, A, C);
		},
		getString(A) {
			let C = this.getUint8Array(A), Q = C.indexOf(0);
			return String.fromCharCode(...C.slice(0, Q));
		}
	});
	return w._initialize(), w;
}
var B = {
	[g.mimeType]: g,
	[D.mimeType]: D
};
var I = class C {
	get_pcm(A) {
		let C = this.module.enc_get_pcm(this.ref, A);
		if (!C) throw Error("PCM buffer allocation failed");
		let Q = this.module.getInt32Array(C, this.channelCount);
		return Array.from({ length: this.channelCount }, (C, g) => this.module.getFloat32Array(Q[g], A));
	}
	get_out_buf(A) {
		let C = this.module.enc_get_out_buf(this.ref);
		return this.module.getUint8Array(C, A);
	}
	get_common_params(A) {
		switch (A.channels) {
			case 1:
			case 2: break;
			default: throw Error("Invalid channel count: ".concat(A.channels, ". ").concat(this.mimeType, " supports 1 or 2 channels."));
		}
		if ("number" != typeof A.sampleRate) throw Error("Invalid sample rate: ".concat(A.sampleRate));
		return new Uint32Array([A.channels, A.sampleRate]);
	}
	static async create(A, Q, g) {
		return new C(A, await w(Q), B[A].parseParams, g);
	}
	configure(A) {
		this.ref && (this.module.enc_free(this.ref), this.ref = 0);
		let C = this.get_common_params(A), Q = this.parseParams(A), g = this.module.malloc(C.byteLength + Q.byteLength);
		if (!g) throw Error("Failed to allocate parameter buffer");
		this.module.getInt32Array(g, C.length).set(C), this.module.getInt32Array(g + C.byteLength, Q.length).set(Q), this.channelCount = A.channels;
		try {
			if (this.ref = this.module.enc_init(g), !this.ref) throw Error("Encoder initialization failed");
		} finally {
			this.module.free(g);
		}
	}
	encode(A) {
		if (A.length !== this.channelCount) throw Error("encode must be called with channel number (".concat(this.channelCount, ") of Float32Arrays"));
		let C = this.get_pcm(A[0].length);
		C.forEach((C, Q) => C.set(A[Q]));
		let Q = this.module.enc_encode(this.ref, C[0].length);
		if (Q < 0) throw Error("Error while encoding: ".concat(Q));
		return this.get_out_buf(Q);
	}
	finalize() {
		let A = this.module.enc_flush(this.ref);
		if (A < 0) throw Error("Error while encoding: ".concat(A));
		return this.get_out_buf(A);
	}
	constructor(C, Q, g, D) {
		_define_property(this, "mimeType", void 0), _define_property(this, "module", void 0), _define_property(this, "parseParams", void 0), _define_property(this, "ref", void 0), _define_property(this, "channelCount", void 0), this.mimeType = C, this.module = Q, this.parseParams = g;
		let w = this.module.version ? this.module.getString(this.module.version()) : "unknown (< 0.7.0)", B = this.module.getString(this.module.mime_type()), E = M();
		if (D?.(Q.module, w, B), E != w) throw Error("JS and WASM version mismatch. JS version: ".concat(E, " WASM version: ").concat(w));
		if (C != B) throw Error("Loaded incorrect WASM for MIME type. JS expected ".concat(C, ", WASM is ").concat(B));
	}
}.create;
var M = function() {
	return "".concat("wasm-media-encoders", "-").concat("0.7.0");
};
//#endregion
export { I as t };
