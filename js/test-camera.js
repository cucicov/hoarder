let facePositionY_start = 400;
// let facePositionX_start = 530;
let facePositionX_start = 110;
const faceHeight = 200;
const faceWidth = 200;

const video = document.getElementById('video');

const constraints = {
    video: true
};

navigator.getMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
);

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
    document.body.append(canvas);

    const displaySize = {
        width: video.width,
        height: video.height
    };

    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        // console.log(detections[0].alignedRect.box.height + ' ' + detections[0].alignedRect.box.width);
        // console.log(detections[0].alignedRect);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        // faceapi.draw.drawDetections(canvas, resizedDetections);

        const ratioHeight = faceHeight / detections[0].alignedRect.box.height;
        const ratioWidth = faceWidth / detections[0].alignedRect.box.width;

        const actualVideoHeight = 560 * ratioHeight;
        const actualVideoWidth = 720 * ratioWidth;
        let $video = $('#video');
        $video.attr('height', actualVideoHeight);
        $video.attr('width', actualVideoWidth);

        facePositionX = facePositionX_start + (560 - actualVideoHeight)/2;
        facePositionY = facePositionY_start + (720 - actualVideoWidth)/2;

        $video.css('left', facePositionX + detections[0].alignedRect.box.x - ((faceWidth - detections[0].alignedRect.box.width)/2));
        $video.css('top', facePositionY - detections[0].alignedRect.box.y + ((faceHeight - detections[0].alignedRect.box.height)/2));
    }, 100)
});
