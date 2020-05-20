let facePositionTopOffset = 290;
let facePositionLeftOffset = 320;
const faceHeight = 200;
const faceWidth = 200;

const video = document.getElementById('video');

const constraints = {
    video: true
};

let displaySize = {
    width: window.innerWidth,
    height: window.innerHeight
};

let canvas = undefined;
let carouselCaptionToImageDiff = undefined; // offset for canvas between image and actual container on bigger resolutions.
let actualVideoHeight = faceHeight;
let actualVideoWidth = faceWidth;

window.onresize = updateCanvas;

function updateCanvas() {
    $('.carousel-item').css('height', $(`#myCarousel .active img`).width());
    let ratioResizeWidth = $(`#myCarousel .active img`).width() / $(`#myCarousel .active img`).prop('naturalWidth');
    let rationResizeHeight = $(`#myCarousel .active img`).height() / $(`#myCarousel .active img`).prop('naturalHeight');
    actualVideoWidth *= ratioResizeWidth;
    actualVideoHeight *= rationResizeHeight;

    displaySize = {
        width: actualVideoWidth,
        height: actualVideoHeight
    };
    faceapi.matchDimensions(canvas, displaySize);
    carouselCaptionToImageDiff = $(`#myCarousel .active .carousel-caption`).width() - $(`#myCarousel .active img`).width();

    // if original image is already resized, resize the canvas as well

    $(`#myCarousel .active canvas`).css({
        left: carouselCaptionToImageDiff/2 + facePositionLeftOffset * ratioResizeWidth,
        right: ($(`#myCarousel .active img`).width() - actualVideoWidth), // automatically calculated margin to the right for responsiveness
        top: facePositionTopOffset * rationResizeHeight //TODO: extract in method.
    }); // diff is from both sides, we need one.
};

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo());

function startVideo() {
    navigator.mediaDevices.getUserMedia(constraints).
    then((stream) => {video.srcObject = stream});
}


video.addEventListener('play', () => {
    canvas = faceapi.createCanvasFromMedia(video);
    canvas.setAttribute('style', `z-index: -1; filter: grayscale(100%) sepia(30%); max-width:100%; height: auto;`);
    $(`#myCarousel .active .carousel-caption`).append(canvas);
    // document.body.append(canvas);

    // faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

        let alignedRect = detections[0].alignedRect;
        const ratioHeight = faceHeight / alignedRect.box.height;
        const ratioWidth = faceWidth / alignedRect.box.width;

        actualVideoHeight = alignedRect.box.height * ratioHeight;
        actualVideoWidth = alignedRect.box.width * ratioWidth;

        actualVideoWidth *= 1.75;
        actualVideoHeight *= 1.75;

        updateCanvas();

        // let facePositionX = facePositionX_start + (alignedRect.box.height - actualVideoHeight) / 2;
        // let facePositionY = facePositionY_start + (alignedRect.box.width  - actualVideoWidth)/2;
        //
        // facePositionX += alignedRect.box.x - ((faceWidth - alignedRect.box.width)/2);
        // facePositionY -= alignedRect.box.y + ((faceHeight - alignedRect.box.height)/2);

        let context = canvas.getContext('2d');
        // The first 2 are the direction and scale of the x axis in pixels.
        // By default it is 1,0. The next two are the direction and scale of the y axis.
        // By default it is 0,1. The last two are the origin. Where on the canvas something will be drawn if you draw at 0,0. By default it is at 0,0 top left.
        context.setTransform(-1,0,0,1, canvas.width, 0);
        context.drawImage(video,
            alignedRect.box.x - 70,
            alignedRect.box.y - 70,
            alignedRect.box.width + 100,
            alignedRect.box.height + 100,
            0,
            0,
            actualVideoWidth,
            actualVideoHeight);

    }, 100)
});
