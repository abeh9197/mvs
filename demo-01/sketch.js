let song;
let fft;
let shapes = []; // 動く図形の配列
let isPlaying = false;
let beatThreshold = 200; // ビートの閾値（低音のエネルギー）
let lastBeat = 0; // 最後のビート時間
let circleRadius = 200; // 巨大な円の基本半径

function preload() {
    song = loadSound('music.mp3');
}

function setup() {
    createCanvas(1920, 1080); // フルHDサイズ
    background(0);
    fft = new p5.FFT();

    // 初期の図形をランダムに生成（10個くらい）
    for (let i = 0; i < 10; i++) {
        shapes.push({
            x: random(width),
            y: random(height),
            vx: random(-5, 5), // 横速度
            vy: random(-5, 5), // 縦速度
            shape: random(['circle', 'square', 'triangle']),
            color: [random(255), random(255), random(255)]
        });
    }

    // UI要素を取得（JavaScriptで直接）
    document.getElementById('seekBar').addEventListener('input', updateSeek);
    document.getElementById('volume').addEventListener('input', updateVolume);
}

function draw() {
    background(0, 20); // 残像効果

    let spectrum = fft.analyze(); // 周波数スペクトル
    let bassEnergy = fft.getEnergy("bass"); // 低音のエネルギー
    let trebleEnergy = fft.getEnergy("treble"); // 高音のエネルギー

    // ビートの検出（低音が閾値を超えたら）
    if (bassEnergy > beatThreshold && millis() - lastBeat > 200) { // 200ms以内に連続しないよう
        circleRadius = min(circleRadius + 100, 500); // ビートで半径を大きく
        lastBeat = millis();
    }
    circleRadius = lerp(circleRadius, 200, 0.05); // 徐々に元に戻る

    // 巨大な円の線を描画
    stroke(255, 100, 100, 100); // ピンク系の線、透明度100
    strokeWeight(map(bassEnergy, 0, 255, 1, 10)); // 低音に応じて線の太さ
    noFill();
    ellipse(width / 2, height / 2, circleRadius * 2, circleRadius * 2); // 巨大な円

    // 既存の図形を更新して描画
    shapes.forEach(shape => {
        shape.vx += random(-0.1, 0.1) * bassEnergy / 255; // 低音で横移動
        shape.vy += random(-0.1, 0.1) * trebleEnergy / 255; // 高音で縦移動

        shape.x += shape.vx;
        shape.y += shape.vy;

        if (shape.x < 0 || shape.x > width) shape.vx *= -1; // 横壁跳ね返り
        if (shape.y < 0 || shape.y > height) shape.vy *= -1; // 縦壁跳ね返り

        let energy = spectrum[floor(random(spectrum.length))]; // ランダムな周波数
        let size = map(energy, 0, 255, 10, 50);
        let r = map(energy, 0, 255, shape.color[0], 255);
        let g = map(energy, 0, 255, shape.color[1], 255);
        let b = map(energy, 0, 255, shape.color[2], 255);

        fill(r, g, b);
        noStroke();

        if (shape.shape === 'circle') {
            ellipse(shape.x, shape.y, size, size);
        } else if (shape.shape === 'square') {
            rectMode(CENTER);
            rect(shape.x, shape.y, size, size);
        } else if (shape.shape === 'triangle') {
            triangle(
                shape.x, shape.y - size / 2,
                shape.x - size / 2, shape.y + size / 2,
                shape.x + size / 2, shape.y + size / 2
            );
        }
    });
}

// 再生/一時停止
function startAudio() {
    if (!song.isPlaying()) {
        song.loop();
        isPlaying = true;
    } else {
        song.pause();
        isPlaying = false;
    }
    updateSeekBar();
}

// シークバーの更新
function updateSeek() {
    if (song.isPlaying()) {
        let seek = document.getElementById('seekBar').value / 100 * song.duration();
        song.jump(seek);
    }
}

// シークバーを自動更新
function updateSeekBar() {
    if (song.isPlaying()) {
        let progress = (song.currentTime() / song.duration()) * 100;
        document.getElementById('seekBar').value = progress;
        requestAnimationFrame(updateSeekBar);
    }
}

// 音量調節
function updateVolume() {
    let volume = document.getElementById('volume').value;
    song.setVolume(volume);
}

// ページ読み込み時に音楽の再生位置を追跡
window.onload = function() {
    updateSeekBar();
};