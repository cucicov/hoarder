let facePositionY_start = 370;
// let facePositionX_start = 530;
let facePositionX_start = 865;
const faceHeight = 200;
const faceWidth = 200;

const video = document.getElementById('video');

const constraints = {
    video: true
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
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.setAttribute('style', 'z-index: -1; filter: grayscale(100%) sepia(30%);');
    document.body.append(canvas);

    const displaySize = {
        width: screen.width,
        height: screen.height
    };

    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        // console.log(detections[0].alignedRect.box.height + ' ' + detections[0].alignedRect.box.width);
        // console.log(detections[0].alignedRect);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        // faceapi.draw.drawDetections(canvas, resizedDetections);

        const ratioHeight = faceHeight / detections[0].alignedRect.box.height;
        const ratioWidth = faceWidth / detections[0].alignedRect.box.width;

        const actualVideoHeight = detections[0].alignedRect.box.height * ratioHeight;
        const actualVideoWidth = detections[0].alignedRect.box.width * ratioWidth;
        // let $video = $('#video');
        // $video.attr('height', actualVideoHeight);
        // $video.attr('width', actualVideoWidth);

        facePositionX = facePositionX_start + (detections[0].alignedRect.box.height - actualVideoHeight)/2;
        facePositionY = facePositionY_start + (detections[0].alignedRect.box.width  - actualVideoWidth)/2;

        // $video.css('left', facePositionX + detections[0].alignedRect.box.x - ((faceWidth - detections[0].alignedRect.box.width)/2));
        // $video.css('top', facePositionY - detections[0].alignedRect.box.y + ((faceHeight - detections[0].alignedRect.box.height)/2));

        facePositionX += detections[0].alignedRect.box.x - ((faceWidth - detections[0].alignedRect.box.width)/2);
        facePositionY -= detections[0].alignedRect.box.y + ((faceHeight - detections[0].alignedRect.box.height)/2);

        // canvas.getContext('2d').drawImage(video,
        //     detections[0].alignedRect.box.x - 70,
        //     detections[0].alignedRect.box.y - 70,
        //     detections[0].alignedRect.box.width + 100,
        //     detections[0].alignedRect.box.height + 100,
        //     facePositionX_start,
        //     facePositionY_start,
        //     actualVideoWidth * 1.75,
        //     actualVideoHeight * 1.75);

        let context = canvas.getContext('2d');
        // The first 2 are the direction and scale of the x axis in pixels.
        // By default it is 1,0. The next two are the direction and scale of the y axis.
        // By default it is 0,1. The last two are the origin. Where on the canvas something will be drawn if you draw at 0,0. By default it is at 0,0 top left.
        context.setTransform(-1,0,0,1, canvas.width, 0);
        context.drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            window.innerWidth - facePositionX_start,
            facePositionY_start,
            actualVideoWidth * 1.75,
            actualVideoHeight * 1.75);

    }, 100)
});
