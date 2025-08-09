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
            showNotification('success', 'All resources loaded successfully!', 2000);
        } catch (error) {
            console.error('Error loading assets:', error);
            showNotification('error', 'Failed to load required resources. Please try again later.');
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
            showNotification('error', 'Please select a valid image file (JPEG, PNG)');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            uploadArea.style.display = 'none';
            avatarPreview.style.display = 'block';
            avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar Preview">`;
            showNotification('success', 'Avatar uploaded successfully!', 2000);
        };
        reader.onerror = () => {
            showNotification('error', 'Failed to read the image file');
        };
        reader.readAsDataURL(file);
    }

    // Generate fake lobby
    async function generateFakeLobby() {
        const nickname = nicknameInput.value.trim() || 'ML Player';
        const avatarFile = avatarInput.files[0];

        if (!avatarFile) {
            showNotification('warning', 'Please upload an avatar image first');
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
            
            showNotification('success', 'Lobby generated successfully!', 3000);
            
        } catch (error) {
            console.error('Error generating image:', error);
            showNotification('error', `Generation failed: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }

    // Download image
    function downloadImage() {
        try {
            const link = document.createElement('a');
            link.download = `ml-lobby-${Date.now()}.png`;
            link.href = resultCanvas.toDataURL('image/png');
            link.click();
            showNotification('success', 'Image download started!', 2000);
        } catch (error) {
            console.error('Download failed:', error);
            showNotification('error', 'Failed to download image');
        }
    }

    // Share image
    async function shareImage() {
        if (navigator.share) {
            try {
                showLoading(true);
                // Convert canvas to blob
                const blob = await new Promise(resolve => {
                    resultCanvas.toBlob(resolve, 'image/png');
                });
                
                const file = new File([blob], 'ml-lobby.png', { type: 'image/png' });
                
                await navigator.share({
                    title: 'My ML Lobby',
                    text: 'Check out my Mobile Legends lobby!',
                    files: [file]
                });
                
                showNotification('success', 'Content shared successfully!', 2000);
            } catch (error) {
                console.error('Error sharing:', error);
                if (error.name !== 'AbortError') {
                    showNotification('warning', 'Sharing was cancelled');
                }
            } finally {
                showLoading(false);
            }
        } else {
            showNotification('info', 'For sharing, please download the image first', 3000);
        }
    }

    // Helper functions
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => {
                console.error('Image load error:', e);
                reject(new Error('Failed to load the image'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    function loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => {
                console.error('Image load error:', e);
                reject(new Error(`Failed to load image from ${url}`));
            };
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

    // Enhanced Notification System
    function showNotification(type, message, duration = 3000) {
        // Remove any existing notifications first
        const existingNotif = document.querySelector('.custom-notification');
        if (existingNotif) existingNotif.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        
        // Notification icon based on type
        let icon;
        switch(type) {
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${message}</div>
            <div class="notification-close"><i class="fas fa-times"></i></div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                hideNotification(notification);
            }, duration);
        }
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            hideNotification(notification);
        });
    }

    function hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    // Initialize the app with welcome message
    setTimeout(() => {
        showNotification('info', 'Welcome to Fake ML Lobby Generator! Upload your avatar to begin', 4000);
    }, 1000);

    // Initialize the app
    init();
});