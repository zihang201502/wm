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

    // ========== 一键三连（跨设备云同步）==========
    // ====== 配置区域：去 https://jsonbin.io 注册后填入 ======
    const JSONBIN_MASTER_KEY = '';  // 你的 X-Master-Key
    const JSONBIN_BIN_ID = '';       // 你的 Bin ID（创建bin后URL里那串）
    // ========================================================

    const LOCAL_STATE_KEY = 'cumulus_triple_state'; // 本地只存用户操作状态
    const cloudEnabled = !!(JSONBIN_MASTER_KEY && JSONBIN_BIN_ID);

    // 计数数据（云端同步）
    let counts = { like: 0, fav: 0, coin: 0 };
    // 用户操作状态（本地存储：是否已点赞/收藏/今天是否投币）
    let userState = loadUserState();

    function loadUserState() {
        try {
            const raw = localStorage.getItem(LOCAL_STATE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { liked: false, faved: false, coinDate: '' };
    }

    function saveUserState() {
        try {
            localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(userState));
        } catch (e) {}
    }

    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    const likeBtn = document.getElementById('likeBtn');
    const favBtn = document.getElementById('favBtn');
    const coinBtn = document.getElementById('coinBtn');
    const likeCount = document.getElementById('likeCount');
    const favCount = document.getElementById('favCount');
    const coinCount = document.getElementById('coinCount');
    const tripleAll = document.getElementById('tripleAll');

    function renderTriple() {
        if (likeCount) likeCount.textContent = counts.like;
        if (favCount) favCount.textContent = counts.fav;
        if (coinCount) coinCount.textContent = counts.coin;
        if (likeBtn) likeBtn.classList.toggle('active', userState.liked);
        if (favBtn) favBtn.classList.toggle('active', userState.faved);
        if (coinBtn) coinBtn.classList.toggle('active', userState.coinDate === todayStr());
    }

    function popBtn(btn) {
        if (!btn) return;
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
    }

    // ====== 云端读写 ======
    async function fetchCounts() {
        if (!cloudEnabled) return;
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
            });
            if (!res.ok) throw new Error('fetch failed');
            const data = await res.json();
            if (data && data.record) {
                counts.like = parseInt(data.record.like) || 0;
                counts.fav = parseInt(data.record.fav) || 0;
                counts.coin = parseInt(data.record.coin) || 0;
                renderTriple();
            }
        } catch (e) {
            console.warn('三连数据拉取失败，使用本地默认值', e);
        }
    }

    let syncing = false;
    async function pushCounts() {
        if (!cloudEnabled) return;
        if (syncing) return;
        syncing = true;
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': JSONBIN_MASTER_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    like: counts.like,
                    fav: counts.fav,
                    coin: counts.coin
                })
            });
            if (!res.ok) throw new Error('push failed');
            const data = await res.json();
            if (data && data.record) {
                counts.like = parseInt(data.record.like) || 0;
                counts.fav = parseInt(data.record.fav) || 0;
                counts.coin = parseInt(data.record.coin) || 0;
                renderTriple();
            }
        } catch (e) {
            console.warn('三连数据同步失败', e);
        } finally {
            syncing = false;
        }
    }

    // 初始化：先渲染本地状态，再拉云端
    renderTriple();
    fetchCounts();

    // 点赞（永久一次，不可取消）
    if (likeBtn) {
        likeBtn.addEventListener('click', function () {
            if (userState.liked) {
                likeBtn.style.transition = 'all 0.1s';
                likeBtn.style.borderColor = 'rgba(255,80,80,0.6)';
                setTimeout(function () { likeBtn.style.borderColor = ''; }, 600);
                return;
            }
            counts.like += 1;
            userState.liked = true;
            saveUserState();
            renderTriple();
            popBtn(likeBtn);
            pushCounts();
        });
    }

    // 收藏（永久一次，不可取消）
    if (favBtn) {
        favBtn.addEventListener('click', function () {
            if (userState.faved) {
                favBtn.style.transition = 'all 0.1s';
                favBtn.style.borderColor = 'rgba(255,80,80,0.6)';
                setTimeout(function () { favBtn.style.borderColor = ''; }, 600);
                return;
            }
            counts.fav += 1;
            userState.faved = true;
            saveUserState();
            renderTriple();
            popBtn(favBtn);
            pushCounts();
        });
    }

    // 投币（一天一次，可取消）
    if (coinBtn) {
        coinBtn.addEventListener('click', function () {
            const today = todayStr();
            if (userState.coinDate === today) {
                counts.coin = Math.max(0, counts.coin - 1);
                userState.coinDate = '';
            } else {
                counts.coin += 1;
                userState.coinDate = today;
            }
            saveUserState();
            renderTriple();
            popBtn(coinBtn);
            pushCounts();
        });
    }

    // 一键三连
    if (tripleAll) {
        tripleAll.addEventListener('click', function () {
            let changed = false;
            if (!userState.liked) {
                counts.like += 1;
                userState.liked = true;
                changed = true;
            }
            if (!userState.faved) {
                counts.fav += 1;
                userState.faved = true;
                changed = true;
            }
            const today = todayStr();
            if (userState.coinDate !== today) {
                counts.coin += 1;
                userState.coinDate = today;
                changed = true;
            }
            if (changed) {
                saveUserState();
                renderTriple();
                popBtn(likeBtn);
                setTimeout(function () { popBtn(favBtn); }, 100);
                setTimeout(function () { popBtn(coinBtn); }, 200);
                tripleAll.textContent = '三连成功！';
                setTimeout(function () { tripleAll.textContent = '一键三连'; }, 1500);
                pushCounts();
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
