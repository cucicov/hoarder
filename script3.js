let facePositionY_start = 200;
// let facePositionX_start = 530;
let facePositionX_start = 730;
const faceHeight = 200;
const faceWidth = 200;

const video = document.getElementById('video');

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
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => {console.log(err)})
}

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.setAttribute('style', 'z-index: -1; filter: grayscale(100%) sepia(30%); transform: rotateY(180deg); -webkit-transform:rotateY(180deg); -moz-transform:rotateY(180deg)')
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
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
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

        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            facePositionX_start,
            facePositionY_start,
            actualVideoWidth,
            actualVideoHeight);

        // two dudes
        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            425,
            210,
            actualVideoWidth * 0.2,
            actualVideoHeight * 0.2);

        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            350,
            190,
            actualVideoWidth * 0.2,
            actualVideoHeight * 0.2);

        // three guys
        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            810,
            655,
            actualVideoWidth * 0.2,
            actualVideoHeight * 0.2);

        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            745,
            658,
            actualVideoWidth * 0.2,
            actualVideoHeight * 0.2);

        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            665,
            660,
            actualVideoWidth * 0.2,
            actualVideoHeight * 0.2);

        // male - female
        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            390,
            555,
            actualVideoWidth * 0.3,
            actualVideoHeight * 0.3);

        canvas.getContext('2d').drawImage(video,
            detections[0].alignedRect.box.x - 70,
            detections[0].alignedRect.box.y - 70,
            detections[0].alignedRect.box.width + 100,
            detections[0].alignedRect.box.height + 100,
            250,
            555,
            actualVideoWidth * 0.33,
            actualVideoHeight * 0.33);

    }, 100)
});
