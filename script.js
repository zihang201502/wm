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
});
