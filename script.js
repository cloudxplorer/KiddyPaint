const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const container = canvas.parentElement;

function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
}

function adjustLayout() {
    const vh = window.innerHeight;
    const headerHeight = document.querySelector('header').offsetHeight;
    const toolbarHeight = document.querySelector('.toolbar').offsetHeight;
    const footerHeight = document.querySelector('footer').offsetHeight;
    const padding = 40;
    const availableHeight = vh - headerHeight - toolbarHeight - footerHeight - padding;
    document.querySelector('.canvas-container').style.height = `${availableHeight}px`;
    resizeCanvas();
}

window.addEventListener('load', adjustLayout);
window.addEventListener('resize', adjustLayout);

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush';
let currentColor = '#FF0000';
let brushSize = 5;
let eraserSize = 20;
let history = [];
let historyStep = -1;

function saveState() {
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.push(imageData);
    historyStep = history.length - 1;
    if (history.length > 50) {
        history.shift();
        historyStep--;
    }
}

function restoreState(step) {
    if (step >= 0 && step < history.length) {
        historyStep = step;
        ctx.putImageData(history[historyStep], 0, 0);
    }
}

function initCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    if (currentTool === 'brush') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = 'source-over';
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = eraserSize;
        ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

function undo() {
    if (historyStep > 0) {
        restoreState(historyStep - 1);
        showStatus("Undo performed");
    } else {
        showStatus("Nothing to undo");
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        restoreState(historyStep + 1);
        showStatus("Redo performed");
    } else {
        showStatus("Nothing to redo");
    }
}

function showStatus(message) {
    const status = document.getElementById('statusIndicator');
    status.textContent = message;
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, 2000);
}

let brushOpen = false;
let eraserOpen = false;
let paletteOpen = false;
let galleryOpen = false;

function updateActiveButton() {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    if (currentTool === 'brush') {
        document.getElementById('brushBtn').classList.add('active');
    } else if (currentTool === 'eraser') {
        document.getElementById('eraserBtn').classList.add('active');
    }
}

document.getElementById('brushBtn').addEventListener('click', () => {
    currentTool = 'brush';
    updateActiveButton();
    toggleSlider('brushSlider');
});

document.getElementById('eraserBtn').addEventListener('click', () => {
    currentTool = 'eraser';
    updateActiveButton();
    toggleSlider('eraserSlider');
});

document.getElementById('paletteBtn').addEventListener('click', () => {
    toggleSlider('colorPalette');
});

function toggleSlider(id) {
    const el = document.getElementById(id);
    const sliders = ['brushSlider', 'eraserSlider', 'colorPalette'];
    sliders.forEach(slider => {
        if (slider !== id) document.getElementById(slider).classList.remove('active');
    });
    el.classList.toggle('active');
}

document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

document.getElementById('saveBtn').addEventListener('click', () => {
    try {
        const link = document.createElement('a');
        link.download = 'my-coloring-page.png';
        link.href = canvas.toDataURL();
        link.click();
        showStatus("Artwork saved!");
    } catch (err) {
        showStatus("Save failed due to cross-origin image!");
    }
});

document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('galleryBtn').addEventListener('click', () => {
    document.getElementById('gallery').classList.toggle('active');
});

document.getElementById('brushSize').addEventListener('input', e => brushSize = e.target.value);
document.getElementById('eraserSize').addEventListener('input', e => eraserSize = e.target.value);

document.getElementById('closeBrushSlider').addEventListener('click', () => document.getElementById('brushSlider').classList.remove('active'));
document.getElementById('closeEraserSlider').addEventListener('click', () => document.getElementById('eraserSlider').classList.remove('active'));
document.getElementById('closeColorPalette').addEventListener('click', () => document.getElementById('colorPalette').classList.remove('active'));
document.getElementById('closeGallery').addEventListener('click', () => document.getElementById('gallery').classList.remove('active'));

function createColorPalette() {
    const colors = [
        '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80',
        '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF', '#FF0080',
        '#FFFFFF', '#808080', '#000000', '#FFC0CB', '#90EE90', '#ADD8E6',
        '#FFD700', '#FF69B4', '#00CED1', '#9370DB', '#32CD32', '#FF4500'
    ];
    const colorGrid = document.getElementById('colorGrid');
    colors.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color';
        colorDiv.style.backgroundColor = color;
        colorDiv.setAttribute('data-color', color);
        colorDiv.addEventListener('click', () => {
            currentColor = color;
            document.getElementById('colorPalette').classList.remove('active');
            showStatus(`Color selected: ${color}`);
        });
        colorGrid.appendChild(colorDiv);
    });
}

function createGallery() {
    const galleryImages = [
        '/gallery/1.png',
        '/gallery/2.png',
         '/gallery/3.png',
        '/gallery/4.png',
         '/gallery/5.png',
        '/gallery/6.png',
         '/gallery/7.png',
        '/gallery/8.png',
    ];
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';
    galleryImages.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${src}" alt="Coloring Page ${index + 1}">`;
        item.addEventListener('click', () => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
                const width = img.width * ratio;
                const height = img.height * ratio;
                const x = (canvas.width - width) / 2;
                const y = (canvas.height - height) / 2;
                ctx.drawImage(img, x, y, width, height);
                saveState();
                document.getElementById('gallery').classList.remove('active');
                showStatus("Image loaded from gallery");
            };
            img.src = src;
        });
        galleryGrid.appendChild(item);
    });
}

document.getElementById('fileInput').addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
                const width = img.width * ratio;
                const height = img.height * ratio;
                const x = (canvas.width - width) / 2;
                const y = (canvas.height - height) / 2;
                ctx.drawImage(img, x, y, width, height);
                saveState();
                showStatus("Image uploaded successfully!");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
}

const footer = document.querySelector('footer');
let footerVisible = false;

function checkScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollTop + windowHeight >= documentHeight - 10) {
        if (!footerVisible) {
            footer.classList.add('visible');
            footerVisible = true;
        }
    } else {
        if (footerVisible) {
            footer.classList.remove('visible');
            footerVisible = false;
        }
    }
}

window.addEventListener('load', () => {
    createColorPalette();
    createGallery();
    initCanvas();
    updateActiveButton();
    checkScroll();
});
window.addEventListener('scroll', checkScroll);
