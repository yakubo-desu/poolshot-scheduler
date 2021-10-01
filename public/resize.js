
const resize = () => {
    // get viewport width and height
    const vw = Math.min(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vh = Math.min(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    // maths stuff!
    const resizeFactor = vw / 1920;
    const shiftX = (1920/2)*(resizeFactor - 1)/resizeFactor;
    const shiftY = (1080/2)*(resizeFactor - 1)/resizeFactor;
    // css manipulations!
    const getBody = () => document.querySelector("body");
    getBody().style.transform = 'scale(' + resizeFactor + ') translate(' + shiftX + 'px, ' + shiftY + 'px)';
    getBody().style.backgroundSize = (vw + 2) + 'px';
    // scroll right extreme, in case needed
    window.scroll(Number.MAX_SAFE_INTEGER, window.scrollY);
    // console.log({vw, vh, resizeFactor, shiftX, shiftY });
}

document.addEventListener('DOMContentLoaded', resize);
window.onresize = resize;
window.onscroll = () => window.scroll(Number.MAX_SAFE_INTEGER, window.scrollY);

