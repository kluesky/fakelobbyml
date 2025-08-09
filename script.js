document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const nicknameInput = document.getElementById('nickname');
    const avatarInput = document.getElementById('avatar');
    const uploadArea = document.getElementById('uploadArea');
    const avatarPreview = document.getElementById('avatarPreview');
    const generateBtn = document.getElementById('generateBtn');
    const resultCanvas = document.getElementById('resultCanvas');
    const resultPlaceholder = document.getElementById('resultPlaceholder');
    const resultActions = document.getElementById('resultActions');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Preload assets
    const assets = {
        bgImage: null,
        frameOverlay: null,
        customFont: null
    };

    // Initialize the app
    async function init() {
        try {
            // Load background image
            assets.bgImage = await loadImageFromUrl('https://files.catbox.moe/liplnf.jpg');
            
            // Load frame overlay
            assets.frameOverlay = await loadImageFromUrl('https://files.catbox.moe/2vm2lt.png');
            
            // Load custom font
            assets.customFont = new FontFace('CustomFont', 'url(https://cloudkuimages.com/uploads/files/CL8QHRYN.ttf)');
            await assets.customFont.load();
            document.fonts.add(assets.customFont);
            
            console.log('All assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            alert('Failed to load required resources. Please try again later.');
        }
    }

    // Event Listeners
    avatarInput.addEventListener('change', handleAvatarUpload);
    generateBtn.addEventListener('click', generateFakeLobby);
    downloadBtn.addEventListener('click', downloadImage);
    shareBtn.addEventListener('click', shareImage);

    // Handle avatar upload
    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            uploadArea.style.display = 'none';
            avatarPreview.style.display = 'block';
            avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar Preview">`;
        };
        reader.readAsDataURL(file);
    }

    // Generate fake lobby
    async function generateFakeLobby() {
        const nickname = nicknameInput.value.trim() || 'ML Player';
        const avatarFile = avatarInput.files[0];

        if (!avatarFile) {
            alert('Please upload an avatar image first');
            return;
        }

        showLoading(true);

        try {
            const avatar = await loadImage(avatarFile);
            
            // Set canvas dimensions
            resultCanvas.width = assets.bgImage.width;
            resultCanvas.height = assets.bgImage.height;
            const ctx = resultCanvas.getContext('2d');
            
            // Draw background
            ctx.drawImage(assets.bgImage, 0, 0, resultCanvas.width, resultCanvas.height);
            
            // Calculate positions
            const avatarSize = 205;
            const frameSize = 293;
            const centerX = (resultCanvas.width - frameSize) / 2;
            const centerY = (resultCanvas.height - frameSize) / 2 - 282;
            const avatarX = centerX + (frameSize - avatarSize) / 2;
            const avatarY = centerY + (frameSize - avatarSize) / 2 - 3;
            
            // Crop and draw avatar
            const minSide = Math.min(avatar.width, avatar.height);
            const cropX = (avatar.width - minSide) / 2;
            const cropY = (avatar.height - minSide) / 2;
            
            ctx.drawImage(
                avatar, 
                cropX, cropY, minSide, minSide, 
                avatarX, avatarY, avatarSize, avatarSize
            );
            
            // Draw frame overlay
            ctx.drawImage(assets.frameOverlay, centerX, centerY, frameSize, frameSize);
            
            // Draw nickname
            const maxFontSize = 36;
            const minFontSize = 24;
            const maxChar = 11;
            
            let fontSize = maxFontSize;
            if (nickname.length > maxChar) {
                const excess = nickname.length - maxChar;
                fontSize -= excess * 2;
                if (fontSize < minFontSize) fontSize = minFontSize;
            }
            
            ctx.font = `${fontSize}px CustomFont`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(nickname, resultCanvas.width / 2 + 13, centerY + frameSize + 15);
            
            // Show result
            resultPlaceholder.style.display = 'none';
            resultCanvas.style.display = 'block';
            resultActions.style.display = 'flex';
            
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Error generating image: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Download image
    function downloadImage() {
        const link = document.createElement('a');
        link.download = `ml-lobby-${Date.now()}.png`;
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    }

    // Share image
    async function shareImage() {
        if (navigator.share) {
            try {
                // Convert canvas to blob
                resultCanvas.toBlob(async (blob) => {
                    const file = new File([blob], 'ml-lobby.png', { type: 'image/png' });
                    
                    await navigator.share({
                        title: 'My ML Lobby',
                        text: 'Check out my Mobile Legends lobby!',
                        files: [file]
                    });
                }, 'image/png');
            } catch (error) {
                console.error('Error sharing:', error);
                alert('Sharing failed: ' + error.message);
            }
        } else {
            alert('Web Share API not supported in your browser. You can download and share manually.');
        }
    }

    // Helper functions
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    function loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    function showLoading(show) {
        if (show) {
            loadingOverlay.style.display = 'flex';
            generateBtn.disabled = true;
        } else {
            loadingOverlay.style.display = 'none';
            generateBtn.disabled = false;
        }
    }

    // Initialize the app
    init();
});