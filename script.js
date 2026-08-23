// Cumulus OS — 关于我们页面交互脚本

document.addEventListener('DOMContentLoaded', function () {
    // 鼠标跟随光晕效果
    const glow = document.querySelector('.glow');
    if (glow) {
        document.addEventListener('mousemove', function (e) {
            const x = e.clientX;
            const y = e.clientY;
            glow.style.transform = `translate(calc(-50% + ${x - window.innerWidth / 2}px * 0.05), calc(-50% + ${y - window.innerHeight / 2}px * 0.05))`;
        });
    }

    // 复制微信号
    const copyBtns = document.querySelectorAll('.wx-copy');
    copyBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const wxIdEl = btn.parentElement.querySelector('.wx-id');
            if (!wxIdEl) return;
            const wxId = wxIdEl.getAttribute('data-wx') || wxIdEl.textContent;

            navigator.clipboard.writeText(wxId).then(function () {
                showCopied(btn);
            }).catch(function () {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = wxId;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showCopied(btn);
            });
        });
    });

    function showCopied(btn) {
        const original = btn.textContent;
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('copied');
        }, 2000);
    }

    // ========== 一键三连 ==========
    const STORAGE_KEY = 'cumulus_triple_data';

    // 读取数据
    function loadTriple() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { like: 0, fav: 0, coin: 0, liked: false, faved: false, coinDate: '' };
    }

    // 保存数据
    function saveTriple(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    // 获取今天日期字符串
    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    let triple = loadTriple();

    const likeBtn = document.getElementById('likeBtn');
    const favBtn = document.getElementById('favBtn');
    const coinBtn = document.getElementById('coinBtn');
    const likeCount = document.getElementById('likeCount');
    const favCount = document.getElementById('favCount');
    const coinCount = document.getElementById('coinCount');
    const tripleAll = document.getElementById('tripleAll');

    // 刷新显示
    function renderTriple() {
        if (likeCount) likeCount.textContent = triple.like;
        if (favCount) favCount.textContent = triple.fav;
        if (coinCount) coinCount.textContent = triple.coin;
        if (likeBtn) likeBtn.classList.toggle('active', triple.liked);
        if (favBtn) favBtn.classList.toggle('active', triple.faved);
        if (coinBtn) coinBtn.classList.toggle('active', triple.coinDate === todayStr());
    }

    // 按钮弹跳动画
    function popBtn(btn) {
        if (!btn) return;
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
    }

    renderTriple();

    // 点赞
    if (likeBtn) {
        likeBtn.addEventListener('click', function () {
            if (triple.liked) {
                triple.like = Math.max(0, triple.like - 1);
                triple.liked = false;
            } else {
                triple.like += 1;
                triple.liked = true;
            }
            saveTriple(triple);
            renderTriple();
            popBtn(likeBtn);
        });
    }

    // 收藏
    if (favBtn) {
        favBtn.addEventListener('click', function () {
            if (triple.faved) {
                triple.fav = Math.max(0, triple.fav - 1);
                triple.faved = false;
            } else {
                triple.fav += 1;
                triple.faved = true;
            }
            saveTriple(triple);
            renderTriple();
            popBtn(favBtn);
        });
    }

    // 投币（一天一次，可取消）
    if (coinBtn) {
        coinBtn.addEventListener('click', function () {
            const today = todayStr();
            if (triple.coinDate === today) {
                // 今天已投过 → 取消投币
                triple.coin = Math.max(0, triple.coin - 1);
                triple.coinDate = '';
            } else {
                // 今天没投过 → 投币
                triple.coin += 1;
                triple.coinDate = today;
            }
            saveTriple(triple);
            renderTriple();
            popBtn(coinBtn);
        });
    }

    // 一键三连
    if (tripleAll) {
        tripleAll.addEventListener('click', function () {
            let changed = false;
            if (!triple.liked) {
                triple.like += 1;
                triple.liked = true;
                changed = true;
            }
            if (!triple.faved) {
                triple.fav += 1;
                triple.faved = true;
                changed = true;
            }
            const today = todayStr();
            if (triple.coinDate !== today) {
                triple.coin += 1;
                triple.coinDate = today;
                changed = true;
            }
            if (changed) {
                saveTriple(triple);
                renderTriple();
                popBtn(likeBtn);
                setTimeout(function () { popBtn(favBtn); }, 100);
                setTimeout(function () { popBtn(coinBtn); }, 200);
                tripleAll.textContent = '三连成功！';
                setTimeout(function () { tripleAll.textContent = '一键三连'; }, 1500);
            } else {
                tripleAll.textContent = '今天已经三连过啦~';
                setTimeout(function () { tripleAll.textContent = '一键三连'; }, 1500);
            }
        });
    }

    // ========== 图片放大灯箱 ==========
    const donateQr = document.getElementById('donateQr');
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightboxClose');

    function openLightbox() {
        if (lightbox) {
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (donateQr) {
        donateQr.addEventListener('click', openLightbox);
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
        // 点击遮罩空白处关闭
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // ESC 键关闭
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
});
