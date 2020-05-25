// --------- CONFIGURABLE PARAMETERS ------------
let imagePositioningParams = undefined;
let localConfiguration = undefined;
let isAllModalsHidden = sessionStorage.getItem('shown-modal'); //first entry should be false. subsequent entries  should be true as modals have already been shown.
let videoStarted = false;
let isMobile = false;
// mapping for configuration files.
let configurationMappings = {
    firstPage: {
        configFile: "js/configuration_firstPage.js",
        container: ".card-columns"
    },
    album1: {
        configFile: "js/configuration.js",
        container: "#myCarousel"
    }
};
// --------- INITIALIZATION ------------
$(document).ready(() => {
    // check for mobile device
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        isMobile = true;
    }
    // resize content for first image
    setTimeout(() => {
        // set carousel content to fixed size because reasons.
        $('.carousel-item').css('height', $(`${localConfiguration.container} .active img`).height());
    }, 1500);
    // load local configuration
    localConfiguration = configurationMappings[$('main').attr('id')];
    // block camera only on first page after the user is prompted the disclaimer.
    // on mobile devices to no turn on camera.
    if (localConfiguration.container !== '.card-columns' && !isMobile) {
        isAllModalsHidden = true;
    }
    //protect image copying
    $(localConfiguration.container).on('contextmenu', 'img', function (e) {
        return false;
    });
    // initialize first canvas
    drawCanvases();
    // set carousel content to fixed size because reasons.
    $(`${localConfiguration.container} .active img`).one('load', () => {
        $('.carousel-item').css('height', $(this).height());
    });
    // update canvas on browser changes.
    window.onresize = updateCanvas;
    window.onload = updateCanvas;
    // re-trigger drawCanvases.
    $('.carousel-control-next, .carousel-control-prev').on('click', function () {
        setTimeout(() => {
            drawCanvases();
            // set carousel content to fixed size because reasons.
            $('.carousel-item').css('height', $(`${localConfiguration.container} .active img`).height());
            // remove all canvases
            $(`${localConfiguration.container} .carousel-caption canvas`).remove();
        }, 800)
    });
    // load configuration
    $.getScript(localConfiguration.configFile, function (data, textStatus, jqxhr) {
        imagePositioningParams = getImagePositioningParams();
    });
    // async image loading
    $(localConfiguration.container).hbaLoadImages({
        attribute: 'data-src',
        onSuccess: function (source, element) {
            element.src = source;
        }
    });
    // modals hidden behavior
    $('#modal2').on('hidden.bs.modal', function (e) {
        isAllModalsHidden = true;
    })
});
const video = document.getElementById('video');
let alignedRect = undefined;
const constraints = {
    video: true
};
let displaySize = {
    width: window.innerWidth,
    height: window.innerHeight
};
let carouselCaptionToImageDiff = 0; // offset for canvas between image and actual container on bigger resolutions.

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo());

function startVideo() {
    if (isAllModalsHidden && !videoStarted) {
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            video.srcObject = stream
        });
        videoStarted = true;
    }
}

function getActiveImageInfo() {
    let activeImage = undefined;
    let imageName = undefined;
    // exception first page card columns item.
    if (localConfiguration.container === '.card-columns') {
        let firstImage = $(`${localConfiguration.container} img`);
        activeImage = firstImage.first();
        imageName = firstImage.first().attr('src').replace('img/', '').replace('.png', '');
    } else {
        activeImage = $(`${localConfiguration.container} .active img`);
        imageName = activeImage.attr('src').replace('img/', '').replace('.png', '');
    }
    return {activeImage, imageName};
}

function removeUnusedCanvases(canvasParameters) {
    let realCanvases = $(`${localConfiguration.container} canvas`);
    realCanvases.each(function () {
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
}

// --------------- LOGIC ----------------
function updateCanvas(canvasInstance) {
    let {activeImage, imageName} = getActiveImageInfo();

    // cleanup inactive canvases
    removeUnusedCanvases(imagePositioningParams[imageName]);

    // ratio when responsively resizing image. adapt canvas as well
    let canvasElement = `${localConfiguration.container} #${canvasInstance.id}`;
    let RATIO_RESIZE_WIDTH = activeImage.width() / activeImage.prop('naturalWidth');
    let RATIO_RESIZE_HEIGHT = activeImage.height() / activeImage.prop('naturalHeight');
    let rightMarginForResponsiveness = $(localConfiguration.container).width() - canvasInstance.actualVideoWidth;

    if (localConfiguration.container !== '.card-columns') {
        // on bigger screens caption is bigger then the image. calculate this difference to give canvas appropriate margin left.
        carouselCaptionToImageDiff = $(`${localConfiguration.container} .active .carousel-caption`).width() - activeImage.width();
        canvasElement = `${localConfiguration.container} .active #${canvasInstance.id}`;
        rightMarginForResponsiveness = activeImage.width() - canvasInstance.actualVideoWidth;
    } else {
        $(`body`).css('height', $(localConfiguration.container).height() + 200); //MEGA HACK. container for first page should be position: absolute to place the camera image, so footer is not position right after this.
    }

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

    $(canvasElement).css({
        left: carouselCaptionToImageDiff / 2 + canvasInstance.facePositionLeftOffset * RATIO_RESIZE_WIDTH,
        right: rightMarginForResponsiveness, // automatically calculated margin to the right for responsiveness
        top: canvasInstance.facePositionTopOffset * RATIO_RESIZE_HEIGHT
    });
};

video.addEventListener('play', function () {
    setTimeout(videoPayEvent, 1000)
});

function videoPayEvent() {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

        if (detections[0]) {
            alignedRect = detections[0].alignedRect;
        }

    }, 1000);
};


function drawCanvases() {
    setInterval(async () => {
        if (!isAllModalsHidden) {
            startVideo();
        } else {
            startVideo();
            let {activeImage, imageName} = getActiveImageInfo();

            let canvasParameters = imagePositioningParams[imageName];
            for (let canvasInstance of canvasParameters) {
                canvasInstance.canvas = faceapi.createCanvasFromMedia(video);
                canvasInstance.canvas.setAttribute('style', `z-index: ${canvasInstance.zIndex}; filter: ${canvasInstance.filter}; max-width:100%; height: auto;`);
                canvasInstance.canvas.setAttribute('id', canvasInstance.id);
            }

            if (alignedRect) {
                for (let canvasInstance of canvasParameters) {
                    let carouselContainer = $(`${localConfiguration.container} .active .carousel-caption`);
                    if (!carouselContainer.length) { // if first page - there is no carousel so place directly in container.
                        carouselContainer = $(localConfiguration.container);
                    }
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
        }

    }, 100);
}

