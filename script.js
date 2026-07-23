// 1. Ambil elemen kanvas & borang HTML
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const formNama = document.getElementById('formNama');
const inputNama = document.getElementById('inputNama');
const btnHantar = document.getElementById('btnHantar');

// =========================================================================
// 🔗 URL APPS SCRIPT GOOGLE SHEET ANDA
// =========================================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfVWfMjCV16XFkB4ztFvieo7Fp_TUrfglgWufYl3uJX4YEF3LfFwRfeQ19OU4UysPv/exec";

// 2. Muat naik SEMUA gambar dari folder assets
const imgPenyu1 = new Image();     imgPenyu1.src = 'assets/penyu.png';
const imgPenyu2 = new Image();     imgPenyu2.src = 'assets/penyu2.png';
const imgScoreboard = new Image(); imgScoreboard.src = 'assets/scoreboard2.png';
const imgMenu = new Image();       imgMenu.src = 'assets/menu.png';
const imgBotol = new Image();      imgBotol.src = 'assets/botol.png';
const imgPastik = new Image();     imgPastik.src = 'assets/pastik.png';
const imgSampah = new Image();     imgSampah.src = 'assets/sampah.png';
const imgObor = new Image();       imgObor.src = 'assets/obor.png';
const imgSealion = new Image();    imgSealion.src = 'assets/sealion.png';
const imgKapal = new Image();      imgKapal.src = 'assets/kapal.png';

// 3. Status Game
let skor = 0;
let nyawa = 3;
let masa = 60;
let gameOver = false;
let dataSudahDihantar = false;

const KELAJUAN_ASAL = 5;
let kelajuanSemasa = KELAJUAN_ASAL;
let tersangkutJaring = false;

// 4. Objek Penyu & Layout Menu
const penyu = {
    x: 200,
    y: 650,
    lebar: 60,
    tinggi: 60
};

const menuFrame = {
    lebar: 350,
    tinggi: 480,
    x: (canvas.width - 350) / 2,
    y: (canvas.height - 480) / 2
};

const butangReplay = {
    x: 125,
    y: menuFrame.y + 280,
    lebar: 200,
    tinggi: 50
};

// 5. Senarai Item Jatuh
const senaraiJenisItem = [
    { nama: 'botol',   imej: imgBotol,   markah: 10,  nyawa: 0,  lebar: 35, tinggi: 45, kelajuan: 3.5 },
    { nama: 'botol',   imej: imgBotol,   markah: 10,  nyawa: 0,  lebar: 35, tinggi: 45, kelajuan: 3.8 },
    { nama: 'botol',   imej: imgBotol,   markah: 10,  nyawa: 0,  lebar: 35, tinggi: 45, kelajuan: 4.0 },
    { nama: 'botol',   imej: imgBotol,   markah: 10,  nyawa: 0,  lebar: 35, tinggi: 45, kelajuan: 3.2 },
    { nama: 'sampah',  imej: imgSampah,  markah: 20,  nyawa: 0,  lebar: 45, tinggi: 45, kelajuan: 4.5 },
    { nama: 'pastik',  imej: imgPastik,  markah: 15,  nyawa: 0,  lebar: 45, tinggi: 45, kelajuan: 3 },
    { nama: 'obor',    imej: imgObor,    markah: -10, nyawa: 0,  lebar: 40, tinggi: 40, kelajuan: 2.5 },
    { nama: 'sealion', imej: imgSealion, markah: -20, nyawa: 0,  lebar: 50, tinggi: 50, kelajuan: 3.5 },
    { nama: 'kapal',   imej: imgKapal,   markah: 0,   nyawa: -1, lebar: 70, tinggi: 50, kelajuan: 2 }
];

let senaraiItemJatuh = [];
let pemasaSpawnItem = 0;

function janaItemBaru() {
    const indeksRawak = Math.floor(Math.random() * senaraiJenisItem.length);
    const template = senaraiJenisItem[indeksRawak];
    return {
        ...template,
        x: Math.random() * (canvas.width - template.lebar),
        y: -60
    };
}

// 6. Input Keyboard & Tetikus
let frameMasa = 0;
const keys = {};

window.addEventListener('keydown', (e) => { 
    keys[e.key] = true; 
    if (gameOver && (e.code === 'Space' || e.key === 'Enter') && formNama.style.display === 'none') {
        mulaSemulaGame();
    }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

canvas.addEventListener('click', (e) => {
    if (gameOver && formNama.style.display === 'none') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (
            mouseX >= butangReplay.x &&
            mouseX <= butangReplay.x + butangReplay.lebar &&
            mouseY >= butangReplay.y &&
            mouseY <= butangReplay.y + butangReplay.tinggi
        ) {
            mulaSemulaGame();
        }
    }
});

// 7. KLIK BUTANG HANTAR NAMA
btnHantar.addEventListener('click', hantarSkorDaftar);

function hantarSkorDaftar() {
    let nama = inputNama.value.trim();
    if (!nama) nama = "Pemain Anonim";

    let statusText = "";
    if (skor >= 100) statusText = "MISI BERJAYA 🏆";
    else if (nyawa <= 0) statusText = "PENYU MATI ☠️";
    else statusText = "MASA TAMAT ⏳";

    btnHantar.innerText = "MENGHANTAR... ⏳";
    btnHantar.disabled = true;

    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nama: nama,
            skor: skor,
            status: statusText
        })
    })
    .then(() => {
        console.log(`Skor ${nama} berjaya dihantar!`);
        formNama.style.display = 'none'; // Sembunyi borang lepas hantar
    })
    .catch(err => {
        console.error('Ralat hantar data:', err);
        formNama.style.display = 'none';
    });
}

// 8. Pemasa & Reset Game
let pemasaInterval;

function mulaPemasa() {
    pemasaInterval = setInterval(() => {
        if (!gameOver) {
            masa--;
            if (masa <= 0) {
                gameOver = true;
                clearInterval(pemasaInterval);
            }
        }
    }, 1000);
}

function mulaSemulaGame() {
    skor = 0;
    nyawa = 3;
    masa = 60;
    gameOver = false;
    dataSudahDihantar = false;
    formNama.style.display = 'none'; // Sembunyi borang
    inputNama.value = ''; // Kosongkan input
    btnHantar.innerText = "HANTAR SKOR 🚀";
    btnHantar.disabled = false;

    penyu.x = 200;
    penyu.y = 650;
    senaraiItemJatuh = [];
    kelajuanSemasa = KELAJUAN_ASAL;
    tersangkutJaring = false;

    clearInterval(pemasaInterval);
    mulaPemasa();
}

// 9. Kemaskini Posisi
function kemaskini() {
    if (gameOver) {
        if (!dataSudahDihantar) {
            dataSudahDihantar = true;
            formNama.style.display = 'block'; // Tunjukkan borang nama comel
        }
        return;
    }

    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && penyu.x > 0) penyu.x -= kelajuanSemasa;
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && penyu.x < canvas.width - penyu.lebar) penyu.x += kelajuanSemasa;
    if ((keys['ArrowUp'] || keys['w'] || keys['W']) && penyu.y > 0) penyu.y -= kelajuanSemasa;
    if ((keys['ArrowDown'] || keys['s'] || keys['S']) && penyu.y < canvas.height - penyu.tinggi) penyu.y += kelajuanSemasa;

    pemasaSpawnItem++;
    if (pemasaSpawnItem > 25 && senaraiItemJatuh.length < 5) {
        senaraiItemJatuh.push(janaItemBaru());
        pemasaSpawnItem = 0;
    }

    for (let i = senaraiItemJatuh.length - 1; i >= 0; i--) {
        let item = senaraiItemJatuh[i];
        item.y += item.kelajuan;

        if (
            penyu.x < item.x + item.lebar &&
            penyu.x + penyu.lebar > item.x &&
            penyu.y < item.y + item.tinggi &&
            penyu.y + penyu.tinggi > item.y
        ) {
            skor = Math.max(0, skor + item.markah);
            nyawa += item.nyawa;

            if (item.nama === 'pastik' && !tersangkutJaring) {
                tersangkutJaring = true;
                kelajuanSemasa = 2;
                setTimeout(() => {
                    kelajuanSemasa = KELAJUAN_ASAL;
                    tersangkutJaring = false;
                }, 3000);
            }

            senaraiItemJatuh.splice(i, 1);

            if (skor >= 100 || nyawa <= 0) {
                gameOver = true;
                clearInterval(pemasaInterval);
            }
            continue;
        }

        if (item.y > canvas.height) {
            senaraiItemJatuh.splice(i, 1);
        }
    }
}

// 10. Fungsi Lukis
function lukis() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (tersangkutJaring) ctx.globalAlpha = 0.5;
    let imejSemasa = (Math.floor(frameMasa / 20) % 2 === 0) ? imgPenyu1 : imgPenyu2;
    let kesanTerapung = Math.sin(frameMasa * 0.05) * 5;
    ctx.drawImage(imejSemasa, penyu.x, penyu.y + kesanTerapung, penyu.lebar, penyu.tinggi);
    ctx.globalAlpha = 1.0;

    for (let i = 0; i < senaraiItemJatuh.length; i++) {
        let item = senaraiItemJatuh[i];
        ctx.drawImage(item.imej, item.x, item.y, item.lebar, item.tinggi);
    }

    // UI Top Bar
    ctx.drawImage(imgScoreboard, 10, 10, 160, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Courier New"';
    ctx.fillText(`Markah:${skor}`, 25, 38);

    ctx.drawImage(imgScoreboard, 280, 10, 160, 45);
    ctx.fillText(`Masa:${masa}s`, 305, 38);

    ctx.font = '20px "Courier New"';
    ctx.fillText(`${'❤️'.repeat(Math.max(0, nyawa))}`, 20, 75);

    // Pop-up Menu Frame
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(imgMenu, menuFrame.x, menuFrame.y, menuFrame.lebar, menuFrame.tinggi);
        ctx.textAlign = 'center';

        if (skor >= 100) {
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 24px "Courier New"';
            ctx.fillText('MISI BERJAYA! 🏆', canvas.width / 2, menuFrame.y + 130);
        } else {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 24px "Courier New"';
            ctx.fillText(nyawa <= 0 ? 'PENYU MATI! ☠️' : 'MASA TAMAT ⏳', canvas.width / 2, menuFrame.y + 130);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText(`Markah Akhir: ${skor}`, canvas.width / 2, menuFrame.y + 200);

        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.roundRect(butangReplay.x, butangReplay.y, butangReplay.lebar, butangReplay.tinggi, 12);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Courier New"';
        ctx.fillText('🔄 MAIN SEMULA', canvas.width / 2, butangReplay.y + 31);

        ctx.font = '12px "Courier New"';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('(atau tekan Spacebar)', canvas.width / 2, menuFrame.y + 400);

        ctx.textAlign = 'left';
    }

    frameMasa++;
}

// 11. Gelung Game
function gameLoop() {
    kemaskini();
    lukis();
    requestAnimationFrame(gameLoop);
}

// 12. Mulakan Game
let gambarDimuatkan = 0;
function semakGambarSiap() {
    gambarDimuatkan++;
    if (gambarDimuatkan === 10) {
        mulaPemasa();
        gameLoop();
    }
}

imgPenyu1.onload = semakGambarSiap;
imgPenyu2.onload = semakGambarSiap;
imgScoreboard.onload = semakGambarSiap;
imgMenu.onload = semakGambarSiap;
imgBotol.onload  = semakGambarSiap;
imgPastik.onload = semakGambarSiap;
imgSampah.onload = semakGambarSiap;
imgObor.onload   = semakGambarSiap;
imgSealion.onload = semakGambarSiap;
imgKapal.onload  = semakGambarSiap;
