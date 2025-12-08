import 'jsdom-global/register.js';
// Provide minimal globals if needed
global.requestAnimationFrame = global.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
// Polyfill ResizeObserver for jsdom environment
if (typeof global.ResizeObserver === 'undefined') {
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
