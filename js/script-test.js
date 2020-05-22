// --------- CONFIGURABLE PARAMETERS ------------
// import {imagePositioningParams} from "./configuration.js";
let imagePositioningParams = undefined;
// --------- INITIALIZATION ------------
$(document).ready(() => {
    //protect image copying
    $('#myCarousel').on('contextmenu', 'img', function(e){
        return false;
    });
    // update canvas on browser changes.
    window.onresize = updateCanvas;
    window.onload = updateCanvas;
    // restart video on slide change to retrigger video play listener.
    $('.carousel-control-next, .carousel-control-prev').on('click', () => {
        video.pause();
        video.play();
    });
    // load configuration
    $.getScript( "js/configuration.js", function( data, textStatus, jqxhr ) {
        imagePositioningParams = getImagePositioningParams();
    });
});
const video = document.getElementById('video');
const constraints = {
    video: true
};
let displaySize = {
    width: window.innerWidth,
    height: window.innerHeight
};
let carouselCaptionToImageDiff = undefined; // offset for canvas between image and actual container on bigger resolutions.

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

function getActiveImageInfo() {
    let activeImage = $(`#myCarousel .active img`);
    let imageName = activeImage.attr('src').replace('img/', '').replace('.png', '');
    return {activeImage, imageName};
}

// --------------- LOGIC ----------------
function updateCanvas(canvasInstance) {
    let {activeImage, imageName} = getActiveImageInfo();

    // cleanup inactive canvases
    let canvasParameters = imagePositioningParams[imageName];
    $('#myCarousel .carousel-caption canvas').each(function() {
        let found = false;
        for (let canvasInstance of canvasParameters) {
            if ($(this).attr('id') === canvasInstance.id) {
                found = true;
            }
        }
        if (!found) {
            $(this).remove();
        }
    });

    // ratio when responsively resizing image. adapt canvas as well
    const RATIO_RESIZE_WIDTH = activeImage.width() / activeImage.prop('naturalWidth');
    const RATIO_RESIZE_HEIGHT = activeImage.height() / activeImage.prop('naturalHeight');

    // set carousel content to fixed size because reasons.
    $('.carousel-item').css('height', activeImage.height());

    // on bigger screens caption is bigger then the image. calculate this difference to give canvas appropriate margin left.
    carouselCaptionToImageDiff = $(`#myCarousel .active .carousel-caption`).width() - activeImage.width();

    // ----------- Get Canvases -------------
    canvasInstance.actualVideoWidth *= RATIO_RESIZE_WIDTH;
    canvasInstance.actualVideoHeight *= RATIO_RESIZE_HEIGHT;
    displaySize = {
        width: canvasInstance.actualVideoWidth,
        height: canvasInstance.actualVideoHeight
    };
    if (canvasInstance.canvas) {
        faceapi.matchDimensions(canvasInstance.canvas, displaySize);
    }

    $(`#myCarousel .active #${canvasInstance.id}`).css({
        left: carouselCaptionToImageDiff/2 + canvasInstance.facePositionLeftOffset * RATIO_RESIZE_WIDTH,
        right: (activeImage.width() - canvasInstance.actualVideoWidth), // automatically calculated margin to the right for responsiveness
        top: canvasInstance.facePositionTopOffset * RATIO_RESIZE_HEIGHT
    });
};

video.addEventListener('play', function(){setTimeout(videoPayEvent, 1000)});

function videoPayEvent() {
    let {activeImage, imageName} = getActiveImageInfo();
    console.log('active image'+ imageName);
    // remove all other canvases

    let canvasParameters = imagePositioningParams[imageName];
    for (let canvasInstance of canvasParameters) {
        canvasInstance.canvas = faceapi.createCanvasFromMedia(video);
        canvasInstance.canvas.setAttribute('style', `z-index: ${canvasInstance.zIndex}; filter: ${canvasInstance.filter}; max-width:100%; height: auto;`);
        canvasInstance.canvas.setAttribute('id', canvasInstance.id);
    }

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

        if (detections[0]) {
            let alignedRect = detections[0].alignedRect;
            for (let canvasInstance of canvasParameters) {
                let carouselContainer = $(`#myCarousel .active .carousel-caption`);
                carouselContainer.find(`#${canvasInstance.canvas.id}`).remove(); //remove old canvas;
                carouselContainer.append(canvasInstance.canvas);

                const RATIO_HEIGHT = canvasInstance.faceHeight / alignedRect.box.height;
                const RATIO_WIDTH = canvasInstance.faceWidth / alignedRect.box.width;

                canvasInstance.actualVideoHeight = alignedRect.box.height * RATIO_HEIGHT * canvasInstance.ratio;
                canvasInstance.actualVideoWidth = alignedRect.box.width * RATIO_WIDTH * canvasInstance.ratio;

                updateCanvas(canvasInstance);

                let context = canvasInstance.canvas.getContext('2d');
                // The first 2 are the direction and scale of the x axis in pixels.
                // By default it is 1,0. The next two are the direction and scale of the y axis.
                // By default it is 0,1. The last two are the origin. Where on the canvas something will be drawn if you draw at 0,0. By default it is at 0,0 top left.
                context.setTransform(canvasInstance.inverseMirror ? 1 : -1, 0, 0, 1, canvasInstance.inverseMirror ? 0 : canvasInstance.canvas.width, 0);
                context.drawImage(video,
                    alignedRect.box.x + canvasInstance.boxXOffset,
                    alignedRect.box.y + canvasInstance.boxYOffset,
                    alignedRect.box.width + canvasInstance.boxWidthOffset,
                    alignedRect.box.height + canvasInstance.boxHeightOffset,
                    0,
                    0,
                    canvasInstance.actualVideoWidth,
                    canvasInstance.actualVideoHeight);
            }
        }

    }, 500);

};
