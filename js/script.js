// --------- CONFIGURABLE PARAMETERS ------------
let facePositionTopOffset = 290;
let facePositionLeftOffset = 320;
const faceHeight = 200;
const faceWidth = 200;

//TODO: export in separate file?
const imagePositioningParams = [
    {
        imageName: 'r_01.png',
        canvasInstances: [
            {
                facePositionTopOffset : 290,
                facePositionLeftOffset: 320,
                ratio: 1.15,
                faceHeight: 200,
                faceWidth: 200,
                zIndex: -1,
                id: 'canvas1',
                filter: 'grayscale(100%) sepia(30%)',
                boxXOffset: - 70,
                boxYOffset: -70,
                boxXWidth: 100,
                boxYWidth: 100,
                //do not edit below
                actualVideoHeight: 200,
                actualVideoWidth: 200
            },
            {
                facePositionTopOffset : 390,
                facePositionLeftOffset: 420,
                ratio: 0.25,
                faceHeight: 200,
                faceWidth: 200,
                zIndex: -2,
                id: 'canvas2',
                filter: 'grayscale(100%) sepia(30%)',
                boxXOffset: - 70,
                boxYOffset: -70,
                boxXWidth: 100,
                boxYWidth: 100,
                //do not edit below
                actualVideoHeight: 200,
                actualVideoWidth: 200
            }
        ]
    }
];

// --------- INITIALIZATION ------------
$(document).ready(() => {
    //protect image copying
    $('#myCarousel').on('contextmenu', 'img', function(e){
        return false;
    });
    // update canvas on browser changes.
    window.onresize = updateCanvas;
    window.onload = updateCanvas;
});
const video = document.getElementById('video');
const constraints = {
    video: true
};
let displaySize = {
    width: window.innerWidth,
    height: window.innerHeight
};
let canvas = undefined;
let canvas2 = undefined;
let carouselCaptionToImageDiff = undefined; // offset for canvas between image and actual container on bigger resolutions.
let actualVideoHeight = faceHeight;
let actualVideoWidth = faceWidth;
let actualVideoHeight2 = faceHeight;
let actualVideoWidth2 = faceWidth;

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

// --------------- LOGIC ----------------
function updateCanvas() {
    let activeImage = $(`#myCarousel .active img`);
    let imageName = activeImage.attr('src').replace('img/','');

    // ratio when responsively resizing image. adapt canvas as well
    let ratioResizeWidth = activeImage.width() / activeImage.prop('naturalWidth');
    let rationResizeHeight = activeImage.height() / activeImage.prop('naturalHeight');

    // set carousel content to fixed size because reasons.
    $('.carousel-item').css('height', activeImage.height());

    // on bigger screens caption is bigger then the image. calculate this difference to give canvas appropriate margin left.
    carouselCaptionToImageDiff = $(`#myCarousel .active .carousel-caption`).width() - activeImage.width();

    // ----------- Get Canvases -------------
    actualVideoWidth *= ratioResizeWidth;
    actualVideoHeight *= rationResizeHeight;
    displaySize = {
        width: actualVideoWidth,
        height: actualVideoHeight
    };
    faceapi.matchDimensions(canvas, displaySize);

    $(`#myCarousel .active #canvas1`).css({
        left: carouselCaptionToImageDiff/2 + facePositionLeftOffset * ratioResizeWidth,
        right: (activeImage.width() - actualVideoWidth), // automatically calculated margin to the right for responsiveness
        top: facePositionTopOffset * rationResizeHeight
    });

    // ----------
    actualVideoWidth2 *= ratioResizeWidth;
    actualVideoHeight2 *= rationResizeHeight;
    displaySize = {
        width: actualVideoWidth2,
        height: actualVideoHeight2
    };
    faceapi.matchDimensions(canvas2, displaySize);

    $(`#myCarousel .active #canvas2`).css({
        left: carouselCaptionToImageDiff/2 + facePositionLeftOffset * ratioResizeWidth,
        right: (activeImage.width() - actualVideoWidth2), // automatically calculated margin to the right for responsiveness
        top: facePositionTopOffset * rationResizeHeight
    });
};

video.addEventListener('play', () => {
    canvas = faceapi.createCanvasFromMedia(video);
    canvas.setAttribute('style', `z-index: 1; filter: grayscale(100%) sepia(30%); max-width:100%; height: auto;`);
    canvas.setAttribute('id', 'canvas1');

    canvas2 = faceapi.createCanvasFromMedia(video);
    canvas2.setAttribute('style', `z-index: 2; filter: grayscale(100%) sepia(30%); max-width:100%; height: auto;`);
    canvas2.setAttribute('id', 'canvas2');

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

        if (detections[0]) {
            $(`#myCarousel .active .carousel-caption`).append(canvas);
            $(`#myCarousel .active .carousel-caption`).append(canvas2);

            let alignedRect = detections[0].alignedRect;
            const ratioHeight = faceHeight / alignedRect.box.height;
            const ratioWidth = faceWidth / alignedRect.box.width;

            actualVideoHeight = alignedRect.box.height * ratioHeight * 1.15;
            actualVideoWidth = alignedRect.box.width * ratioWidth * 1.15;
            actualVideoHeight2 = alignedRect.box.height * ratioHeight * 0.25;
            actualVideoWidth2 = alignedRect.box.width * ratioWidth * 0.25;

            updateCanvas();

            let context = canvas.getContext('2d');
            let context2 = canvas2.getContext('2d');
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

            context2.setTransform(-1,0,0,1, canvas2.width, 0);
            context2.drawImage(video,
                alignedRect.box.x - 70,
                alignedRect.box.y - 70,
                alignedRect.box.width + 100,
                alignedRect.box.height + 100,
                0,
                0,
                actualVideoWidth2,
                actualVideoHeight2);
        }

    }, 100);

    // --------------------------------------------------


});
