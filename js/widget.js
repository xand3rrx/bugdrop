(() => {
    // Get site ID from script tag
    const scriptTag = document.currentScript;
    const siteId = scriptTag.getAttribute('data-site-id');

    if (!siteId) {
        console.error('Feedback widget: Missing data-site-id attribute');
        return;
    }

    // Get base URL from script src
    const scriptSrc = scriptTag.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

    // Check if site is active and get customization before initializing
    fetch(`${baseUrl}/api/check_site_status.php?site_key=${siteId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.is_active) {
                console.log('Feedback widget: Site is not active');
                return;
            }
            // Use the custom bug color or fallback to blue
            const bugColor = data.bug_color || 'blue';
            // Use the custom bug size or fallback to medium (48px)
            const bugSize = data.bug_size || 'medium';
            // Use the custom bug position or fallback to left
            const bugPosition = data.bug_position || 'left';
            initializeWidget(bugColor, bugSize, bugPosition);
        })
        .catch(error => {
            console.error('Feedback widget: Failed to check site status', error);
        });

    function initializeWidget(bugColor, bugSize, bugPosition) {
        // Load html2canvas-pro instead of html2canvas
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://unpkg.com/html2canvas-pro';
        document.head.appendChild(html2canvasScript);

        // Map of size names to pixel values
        const sizeMap = {
            'small': '32px',
            'medium': '48px',
            'large': '64px',
            'xl': '80px'
        };

        // CSS styles for the widget
        const styles = `
            @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');

            /* Mobile viewport meta */
            @viewport {
                width: device-width;
                zoom: 1.0;
            }

            .feedback-widget {
                --widget-color: #4a90e2;
                --widget-hover: #357abd;
                --widget-text: #ffffff;
                --modal-bg: #ffffff;
                --modal-text: #333333;
                position: fixed;
                z-index: 2147483640;
                transition: transform 0.3s ease;
                touch-action: manipulation; /* Optimize for touch */
                user-select: none;
                -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
            }
            
            .feedback-bug-icon {
                width: ${sizeMap[bugSize]};
                height: ${sizeMap[bugSize]};
                cursor: move;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s ease;
                user-select: none;
                min-width: ${sizeMap[bugSize]}; /* Use the actual size from sizeMap */
                min-height: ${sizeMap[bugSize]}; /* Use the actual size from sizeMap */
                padding: 0; /* Remove padding to prevent size increase */
            }
            
            /* Mobile-specific styles */
            @media (max-width: 768px) {
                .feedback-modal {
                    width: 90vw !important; /* Use viewport width */
                    max-width: 320px;
                    margin: auto;
                }

                .feedback-modal-body {
                    padding: 16px !important; /* Larger padding on mobile */
                }

                .feedback-modal textarea {
                    min-height: 100px; /* Taller textarea on mobile */
                    font-size: 16px !important; /* Prevent zoom on iOS */
                    padding: 12px !important; /* Larger padding for touch */
                }

                .feedback-modal-footer {
                    padding: 16px !important;
                    flex-wrap: wrap; /* Allow wrapping on small screens */
                    gap: 12px;
                }

                .feedback-screenshot-btn {
                    width: 44px !important; /* Larger touch target */
                    height: 44px !important;
                }

                .feedback-modal button.submit-btn {
                    padding: 12px 24px !important; /* Larger touch target */
                    font-size: 16px !important;
                    width: 100%; /* Full width on mobile */
                    margin-top: 8px;
                }

                .feedback-modal-close {
                    width: 44px !important; /* Larger touch target */
                    height: 44px !important;
                    font-size: 24px !important;
                }

                /* Improve touch targets for screenshot preview */
                .feedback-screenshot-preview .remove-screenshot {
                    width: 32px !important;
                    height: 32px !important;
                    font-size: 18px !important;
                }
            }

            .feedback-bug-icon:hover {
                transform: scale(1.1);
            }
            
            .feedback-bug-icon img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                pointer-events: none;
                display: block; /* Ensure proper sizing */
            }
            
            .feedback-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fff;
                width: 320px;
                z-index: 2147483647;
                border-radius: 12px;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                user-select: none;
                max-height: 90vh; /* Prevent modal from being taller than viewport */
                overflow-y: auto; /* Allow scrolling if needed */
                -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
            }

            .feedback-modal.dragging {
                user-select: none;
                cursor: move;
            }

            .feedback-modal.dragging * {
                cursor: move;
            }

            .feedback-modal-header {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 12px;
                cursor: move;
                border-bottom: 1px solid #f0f0f0;
                user-select: none;
            }

            .feedback-modal-header h3 {
                margin: 0;
                color: #1c1c1c;
                font-size: 15px;
                font-weight: 500;
                flex-grow: 1;
            }

            .feedback-modal-close {
                width: 20px;
                height: 20px;
                border: none;
                background: none;
                cursor: pointer;
                padding: 0;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }

            .feedback-modal-close:hover {
                color: #333;
            }

            .feedback-modal-body {
                padding: 12px 16px;
            }

            .feedback-modal.success .feedback-modal-body {
                text-align: center;
                padding: 32px 16px;
            }

            .feedback-modal.success .feedback-modal-body svg {
                width: 48px;
                height: 48px;
                color: #03346E;
                margin-bottom: 16px;
            }

            .feedback-modal.success .feedback-modal-body h4 {
                color: #03346E;
                font-size: 18px;
                margin: 0 0 8px 0;
            }

            .feedback-modal.success .feedback-modal-body p {
                color: #666;
                font-size: 14px;
                margin: 0;
            }
            
            .feedback-modal textarea {
                width: 100%;
                min-height: 80px;
                padding: 10px;
                border: 1px solid #e6e6e6;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.4;
                resize: none;
                font-family: inherit;
                margin: 0;
                box-sizing: border-box;
                background: white;
                user-select: text;
            }
            
            .feedback-modal textarea:focus {
                outline: none;
                border-color: #03346E;
            }

            .feedback-modal-footer {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-top: 1px solid #f0f0f0;
            }

            .feedback-modal-footer-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .feedback-screenshot-btn {
                width: 32px;
                height: 32px;
                border: 1px solid #e6e6e6;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                transition: all 0.2s ease;
            }

            .feedback-screenshot-btn:hover {
                border-color: #03346E;
                color: #03346E;
            }

            .feedback-screenshot-btn.active {
                background: #03346E;
                border-color: #03346E;
                color: white;
            }

            .feedback-screenshot-preview {
                display: none;
                margin-top: 12px;
                position: relative;
            }

            .feedback-screenshot-preview.visible {
                display: block;
            }

            .feedback-screenshot-preview img {
                width: 100%;
                border-radius: 6px;
                border: 1px solid #e6e6e6;
            }

            .feedback-screenshot-preview .remove-screenshot {
                position: absolute;
                top: -6px;
                right: 10px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #fff;
                border: 1px solid #e6e6e6;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 14px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .feedback-screenshot-preview .remove-screenshot:hover {
                background: #f5f5f5;
                color: #333;
            }

            .feedback-modal button.submit-btn {
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                border: none;
                background: #03346e;
                color: white;
                transition: all 0.2s ease;
            }

            .feedback-modal button.submit-btn:hover {
                background: #2366b2;
                transform: translateY(-1px);
            }

            .feedback-modal button.submit-btn:active {
                transform: translateY(0);
            }

            .feedback-modal button.submit-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
            }

            .feedback-branding {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                font-size: 11px;
                color: #666;
                gap: 4px;
                border-top: 1px solid #f0f0f0;
            }

            .feedback-branding a {
                color: #333;
                text-decoration: none;
                font-weight: 500;
                font-size: 12px;
            }

            .feedback-tooltip {
                position: absolute;
                top: 50%;
                left: calc(100% + 10px);
                transform: translateY(-50%);
                background-color: #333;
                color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                width: 230px;
                text-align: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
                z-index: 1;
                pointer-events: none;
            }

            .feedback-tooltip::after {
                content: '';
                position: absolute;
                top: 50%;
                right: 100%;
                margin-top: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: transparent #333 transparent transparent;
            }

            /* Mobile-specific modal styles */
            @media (max-width: 768px) {
                /* Base modal styles - remove default desktop positioning */
                .feedback-modal {
                    position: static;
                    top: auto;
                    left: auto;
                    transform: none;
                }

                /* Overlay styles */
                .modal-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.5) !important;
                    z-index: 2147483646 !important;
                    opacity: 0;
                    transition: opacity 0.3s ease-out !important;
                }

                .modal-overlay.visible {
                    opacity: 1;
                }

                .feedback-modal.mobile-fullscreen {
                    position: fixed !important;
                    top: auto !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    max-width: none !important;
                    max-height: 70vh !important;
                    min-height: 300px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border-bottom-left-radius: 0 !important;
                    border-bottom-right-radius: 0 !important;
                    border-top-left-radius: 16px !important;
                    border-top-right-radius: 16px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    background: #fff !important;
                    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12) !important;
                    z-index: 2147483647 !important;
                    transform: translateY(100%) !important;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    will-change: transform !important;
                }

                .feedback-modal.mobile-fullscreen.visible {
                    transform: translateY(0) !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-modal-header {
                    padding: 16px !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                    background: var(--modal-bg) !important;
                    position: relative !important;
                    z-index: 2 !important;
                    border-top-left-radius: 16px !important;
                    border-top-right-radius: 16px !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-modal-body {
                    flex: 1 1 auto !important;
                    padding: 20px !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    background: var(--modal-bg) !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-modal-footer {
                    padding: 16px !important;
                    border-top: 1px solid #f0f0f0 !important;
                    background: #fff !important;
                    position: relative !important;
                    z-index: 2 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-branding {
                    padding: 12px 16px !important;
                    border-top: 1px solid #f0f0f0 !important;
                    background: #fff !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .feedback-modal.mobile-fullscreen textarea {
                    height: 120px !important;
                    font-size: 16px !important;
                    padding: 12px !important;
                    margin-bottom: 16px !important;
                    border-radius: 8px !important;
                    resize: none !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-screenshot-preview {
                    margin: 16px -20px !important;
                    background: #f8f8f8 !important;
                    position: relative !important;
                    z-index: 1 !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-screenshot-preview img {
                    border: none !important;
                    width: 100% !important;
                    height: auto !important;
                    display: block !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-modal-close {
                    width: 44px !important;
                    height: 44px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 24px !important;
                    margin-right: -8px !important;
                    position: relative !important;
                    z-index: 3 !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                    color: #666 !important;
                }

                .feedback-modal.mobile-fullscreen .feedback-screenshot-btn {
                    width: 44px !important;
                    height: 44px !important;
                    flex-shrink: 0 !important;
                    border: 1px solid #e6e6e6 !important;
                    border-radius: 8px !important;
                    background: white !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: black !important;
                }

                .feedback-modal.mobile-fullscreen .submit-btn {
                    position: relative !important;
                    z-index: 2 !important;
                    flex: 1 !important;
                    margin: 0 !important;
                    height: 44px !important;
                    border-radius: 8px !important;
                    font-size: 16px !important;
                }
            }
        `;

        // Create and inject styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Create the widget button
        const widget = document.createElement('div');
        widget.className = 'feedback-widget';
        widget.style[bugPosition] = '20px'; // Set position based on bugPosition
        widget.style.bottom = '20px';
        widget.style.position = 'fixed';
        widget.style.zIndex = '2147483640';
        widget.style.transition = 'transform 0.2s ease';
        
        const bugIcon = document.createElement('div');
        bugIcon.className = 'feedback-bug-icon';
        const iconSize = parseInt(sizeMap[bugSize]);
        bugIcon.innerHTML = `<img src="https://cdn.statically.io/gh/xand3rrx/bugdrop-assets/main/bugs/${bugColor}.png" alt="Feedback">`;
        
        widget.appendChild(bugIcon);
        document.body.appendChild(widget);

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'feedback-tooltip';
        tooltip.textContent = 'Spotted a bug? Drag me there!';
        widget.appendChild(tooltip);

        // Make bug icon draggable
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let lastDropX = 0;
        let lastDropY = 0;
        let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        function resetPosition() {
            widget.style[bugPosition] = '20px';
            widget.style.bottom = '20px';
            if (bugPosition === 'right') {
                widget.style.left = '';
            } else {
                widget.style.right = '';
            }
            widget.style.top = '';
        }

        // Update cursor style based on device
        bugIcon.style.cursor = isMobile ? 'pointer' : 'move';

        function handleTouchStart(e) {
            if (isMobile) {
                // For mobile, just store the touch position for potential click/tap detection
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                bugIcon.style.opacity = '0.8';
            }
        }

        function handleTouchMove(e) {
            if (isMobile) {
                // Prevent scrolling while touching the bug icon
                e.preventDefault();
            }
        }

        function handleTouchEnd(e) {
            if (isMobile) {
                bugIcon.style.opacity = '1';
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;

                // Calculate if it was a tap (small movement)
                const moveX = Math.abs(endX - startX);
                const moveY = Math.abs(endY - startY);
                
                if (moveX < 10 && moveY < 10) {
                    // It was a tap, show the feedback modal
                    closeModal();
                    showFeedbackModal(endX, endY);
                }
            }
        }

        function handleDragStart(e) {
            if (!isMobile && e.target.closest('.feedback-bug-icon')) {
                isDragging = true;
                
                // Get the bug icon's position relative to the cursor
                const bugIconRect = e.target.closest('.feedback-bug-icon').getBoundingClientRect();
                const offsetX = e.clientX - bugIconRect.left;
                const offsetY = e.clientY - bugIconRect.top;
                
                startX = e.clientX;
                startY = e.clientY;
                
                // Get current position
                const rect = widget.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                
                // Store the offsets for use during drag
                widget.dataset.offsetX = offsetX;
                widget.dataset.offsetY = offsetY;
                
                // Switch to absolute positioning
                widget.style.position = 'fixed';
                widget.style.left = initialLeft + 'px';
                widget.style.top = initialTop + 'px';
                widget.style.right = '';
                widget.style.bottom = '';
                widget.style.transition = 'none';
                
                // Add visual feedback for drag start
                widget.style.transform = 'scale(1.1)';
                
                // Hide tooltip when dragging starts
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            }
        }

        function handleDrag(e) {
            if (!isMobile && isDragging) {
                e.preventDefault();
                
                // Get stored offsets
                const offsetX = parseFloat(widget.dataset.offsetX) || 0;
                const offsetY = parseFloat(widget.dataset.offsetY) || 0;
                
                // Calculate new position accounting for the offset
                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;

                // Get viewport dimensions
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Get widget dimensions
                const widgetRect = widget.getBoundingClientRect();
                const widgetWidth = widgetRect.width;
                const widgetHeight = widgetRect.height;

                // Add padding
                const padding = 20;

                // Constrain to viewport bounds
                newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - widgetWidth - padding));
                newTop = Math.max(padding, Math.min(newTop, viewportHeight - widgetHeight - padding));

                // Apply new position
                widget.style.left = newLeft + 'px';
                widget.style.top = newTop + 'px';

                // Auto-scroll when near edges
                const scrollThreshold = 50;
                const scrollStep = 15;

                if (e.clientX < scrollThreshold) {
                    window.scrollBy(-scrollStep, 0);
                    newLeft += scrollStep;
                } else if (e.clientX > viewportWidth - scrollThreshold) {
                    window.scrollBy(scrollStep, 0);
                    newLeft -= scrollStep;
                }

                if (e.clientY < scrollThreshold) {
                    window.scrollBy(0, -scrollStep);
                    newTop += scrollStep;
                } else if (e.clientY > viewportHeight - scrollThreshold) {
                    window.scrollBy(0, scrollStep);
                    newTop -= scrollStep;
                }

                // Update position
                widget.style.left = newLeft + 'px';
                widget.style.top = newTop + 'px';
            }
        }

        function handleDragEnd(e) {
            if (!isMobile && isDragging) {
                isDragging = false;
                widget.style.transition = 'transform 0.2s ease';
                widget.style.transform = 'scale(1)';

                lastDropX = e.clientX;
                lastDropY = e.clientY;

                const dragDistance = Math.sqrt(
                    Math.pow(lastDropX - startX, 2) + 
                    Math.pow(lastDropY - startY, 2)
                );

                if (dragDistance > 10) {
                    closeModal();
                    showFeedbackModal(lastDropX, lastDropY);
                }
            }
        }

        // Add mouse event listeners only for desktop
        if (!isMobile) {
            widget.addEventListener('mousedown', handleDragStart);
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);

            // Show/hide tooltip only on desktop
            bugIcon.addEventListener('mouseenter', () => {
                if (!isDragging) {
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                }
            });

            bugIcon.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });

            // Show initial tooltip on desktop
            setTimeout(() => {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
                setTimeout(() => {
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                }, 3500);
            }, 500);
        }

        // Add touch event listeners for mobile
        widget.addEventListener('touchstart', handleTouchStart, { passive: false });
        widget.addEventListener('touchmove', handleTouchMove, { passive: false });
        widget.addEventListener('touchend', handleTouchEnd);

        // Update tooltip text based on device
        tooltip.textContent = isMobile ? 'Tap to report a bug' : 'Spotted a bug? Drag me there!';

        // Load dom-to-image library
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js';
        document.head.appendChild(script);

        script.onload = () => {
            // Add widget to page after dom-to-image is loaded
            widget.appendChild(bugIcon);
            document.body.appendChild(widget);
        };

        // Create and show feedback modal
        function showFeedbackModal(x, y) {
            // Create overlay first
            let overlay;
            if (isMobile) {
                overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                document.body.appendChild(overlay);
                // Trigger reflow
                overlay.offsetHeight;
                overlay.classList.add('visible');
            }

            const modal = document.createElement('div');
            modal.className = 'feedback-modal';
            
            // Add mobile-fullscreen class for mobile devices
            if (isMobile) {
                modal.classList.add('mobile-fullscreen');
                // Prevent body scrolling when modal is open
                document.body.style.overflow = 'hidden';
            }

            // Add modal dragging functionality
            let isModalDragging = false;
            let modalStartX = 0;
            let modalStartY = 0;
            let modalInitialLeft = 0;
            let modalInitialTop = 0;

            function handleModalDragStart(e) {
                if (!isMobile && e.target.closest('.feedback-modal-header')) {
                    isModalDragging = true;
                    modalStartX = e.clientX;
                    modalStartY = e.clientY;

                    const rect = modal.getBoundingClientRect();
                    modalInitialLeft = rect.left;
                    modalInitialTop = rect.top;

                    modal.classList.add('dragging');
                    modal.style.transition = 'none';
                }
            }

            function handleModalDrag(e) {
                if (!isMobile && isModalDragging) {
                    e.preventDefault();

                    const deltaX = e.clientX - modalStartX;
                    const deltaY = e.clientY - modalStartY;

                    let newLeft = modalInitialLeft + deltaX;
                    let newTop = modalInitialTop + deltaY;

                    // Get viewport dimensions
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    // Get modal dimensions
                    const modalRect = modal.getBoundingClientRect();
                    const modalWidth = modalRect.width;
                    const modalHeight = modalRect.height;

                    // Add padding
                    const padding = 20;

                    // Constrain to viewport bounds
                    newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - modalWidth - padding));
                    newTop = Math.max(padding, Math.min(newTop, viewportHeight - modalHeight - padding));

                    modal.style.left = newLeft + 'px';
                    modal.style.top = newTop + 'px';
                }
            }

            function handleModalDragEnd() {
                if (!isMobile && isModalDragging) {
                    isModalDragging = false;
                    modal.classList.remove('dragging');
                    modal.style.transition = '';
                }
            }

            // Add modal drag event listeners
            document.addEventListener('mousemove', handleModalDrag);
            document.addEventListener('mouseup', handleModalDragEnd);
            
            modal.innerHTML = `
                <div class="feedback-modal-header" onmousedown="event.preventDefault()">
                    <h3>What's bugging you?</h3>
                    <button class="feedback-modal-close">×</button>
                </div>
                <div class="feedback-modal-body">
                    <textarea placeholder="The sign in button doesn't work..."></textarea>
                    <div class="feedback-screenshot-preview">
                        <img />
                        <button class="remove-screenshot">×</button>
                    </div>
                </div>
                <div class="feedback-modal-footer">
                    <div class="feedback-modal-footer-left">
                        <button class="feedback-screenshot-btn" title="Add screenshot">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M14.4 2.4h-2L11.2 1H4.8L3.6 2.4h-2C.72 2.4 0 3.12 0 4v8c0 .88.72 1.6 1.6 1.6h12.8c.88 0 1.6-.72 1.6-1.6V4c0-.88-.72-1.6-1.6-1.6zM8 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6.4c-1.32 0-2.4 1.08-2.4 2.4 0 1.32 1.08 2.4 2.4 2.4 1.32 0 2.4-1.08 2.4-2.4 0-1.32-1.08-2.4-2.4-2.4z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    <button class="submit-btn">Submit</button>
                </div>
                <div class="feedback-branding">
                    Lightweight feedback by <a href="https://bugdrop.app" target="_blank" style="font-family: 'Lilita One', cursive;">bugdrop</a>🐞
                </div>
            `;

            document.body.appendChild(modal);

            // Add mousedown event listener for modal dragging
            const modalHeader = modal.querySelector('.feedback-modal-header');
            modalHeader.addEventListener('mousedown', handleModalDragStart);

            // Position modal
            if (!isMobile) {
                // Desktop positioning logic
                const modalRect = modal.getBoundingClientRect();
                const padding = 20;
                
                let modalLeft = Math.min(
                    Math.max(x + 10, padding),
                    window.innerWidth - modalRect.width - padding
                );
                let modalTop = Math.min(
                    Math.max(y - modalRect.height / 2, padding),
                    window.innerHeight - modalRect.height - padding
                );

                modal.style.transform = 'none';
                modal.style.left = modalLeft + 'px';
                modal.style.top = modalTop + 'px';
            } else {
                // Trigger animation after a frame
                requestAnimationFrame(() => {
                    modal.classList.add('visible');
                });
            }

            const closeBtn = modal.querySelector('.feedback-modal-close');
            closeBtn.addEventListener('click', () => {
                if (isMobile) {
                    // Animate out
                    modal.classList.remove('visible');
                    overlay.classList.remove('visible');
                    // Wait for animation to complete
                    setTimeout(() => {
                        closeModal();
                        resetPosition();
                        // Remove overlay
                        overlay.remove();
                        // Re-enable body scrolling
                        document.body.style.overflow = '';
                    }, 300);
                } else {
                    closeModal();
                    resetPosition();
                }
            });

            // Rest of the existing modal setup code...
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            const submitBtn = modal.querySelector('.submit-btn');
            const textarea = modal.querySelector('textarea');
            const screenshotBtn = modal.querySelector('.feedback-screenshot-btn');
            const screenshotPreview = modal.querySelector('.feedback-screenshot-preview');
            const screenshotImg = screenshotPreview.querySelector('img');
            const removeScreenshotBtn = screenshotPreview.querySelector('.remove-screenshot');

            let screenshot = null;

            async function takeScreenshot() {
                // Hide modal and overlay during screenshot
                modal.style.visibility = 'hidden';
                const overlay = document.querySelector('.modal-overlay');
                if (overlay) {
                    overlay.style.visibility = 'hidden';
                }
                
                // Make the bug icon stand out during screenshot
                const originalZIndex = widget.style.zIndex;
                widget.style.zIndex = '999999';
                bugIcon.style.boxShadow = '0 0 0 4px rgba(74, 144, 226, 0.5)';
                
                try {
                    // Take screenshot with mobile optimizations
                    const canvas = await html2canvas(document.body, {
                        // Optimize for mobile
                        scale: window.devicePixelRatio,
                        useCORS: true,
                        allowTaint: false,
                        backgroundColor: null,
                        logging: false,
                        imageTimeout: 5000,
                        removeContainer: true,
                        // Capture full document dimensions
                        width: window.innerWidth,
                        height: window.innerHeight,
                        x: window.pageXOffset,
                        y: window.pageYOffset,
                        // Only ignore the modal and overlay
                        ignoreElements: (element) => {
                            return element.classList.contains('feedback-modal') || 
                                   element.classList.contains('modal-overlay');
                        },
                        // Handle mobile-specific clone modifications
                        onclone: (clonedDoc) => {
                            // Only remove other fixed elements, keep the widget
                            const fixedElements = clonedDoc.querySelectorAll('*[style*="position: fixed"]');
                            fixedElements.forEach(el => {
                                if (!el.classList.contains('feedback-modal') && 
                                    !el.classList.contains('feedback-widget') &&
                                    !el.classList.contains('modal-overlay')) {
                                    el.style.display = 'none';
                                }
                            });
                            
                            // Ensure widget is visible in clone
                            const clonedWidget = clonedDoc.querySelector('.feedback-widget');
                            if (clonedWidget) {
                                clonedWidget.style.visibility = 'visible';
                                clonedWidget.style.opacity = '1';
                                clonedWidget.style.zIndex = '999999';
                            }
                        }
                    });

                    screenshot = canvas.toDataURL('image/png', 0.8);
                    screenshotImg.src = screenshot;
                    screenshotPreview.classList.add('visible');
                    screenshotBtn.classList.add('active');
                } catch (error) {
                    console.error('Failed to take screenshot:', error);
                    const errorDiv = modal.querySelector('.error') || document.createElement('div');
                    errorDiv.className = 'error';
                    errorDiv.style.cssText = `
                        display: block;
                        margin: 8px 12px;
                        padding: 8px;
                        background: #fff0f0;
                        color: #e74c3c;
                        border-radius: 4px;
                        font-size: 13px;
                    `;
                    errorDiv.textContent = 'Could not capture screenshot. You can still submit feedback without it.';
                    
                    if (!modal.querySelector('.error')) {
                        const modalBody = modal.querySelector('.feedback-modal-body');
                        modalBody.insertBefore(errorDiv, modalBody.firstChild);
                    }
                    
                    screenshot = null;
                    screenshotBtn.classList.remove('active');
                    screenshotPreview.classList.remove('visible');
                } finally {
                    // Restore original styles
                    widget.style.zIndex = originalZIndex;
                    bugIcon.style.boxShadow = '';
                    modal.style.visibility = 'visible';
                    if (overlay) {
                        overlay.style.visibility = 'visible';
                    }
                }
            }

            function removeScreenshot() {
                screenshot = null;
                screenshotPreview.classList.remove('visible');
                screenshotBtn.classList.remove('active');
            }

            screenshotBtn.addEventListener('click', takeScreenshot);
            removeScreenshotBtn.addEventListener('click', removeScreenshot);
            
            submitBtn.addEventListener('click', async () => {
                const message = textarea.value.trim();
                if (!message) {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = 'Please describe the issue';
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
                errorDiv.style.display = 'none';

                try {
                    // Send feedback to server
                    const response = await fetch(`${baseUrl}/api/report.php`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            siteId,
                            message,
                            screenshot: screenshot || null,
                            pageUrl: window.location.href,
                            x,
                            y,
                            technical: {
                                browser: {
                                    userAgent: navigator.userAgent,
                                    vendor: navigator.vendor,
                                    language: navigator.language,
                                    cookieEnabled: navigator.cookieEnabled,
                                    doNotTrack: navigator.doNotTrack,
                                },
                                screen: {
                                    width: window.screen.width,
                                    height: window.screen.height,
                                    availWidth: window.screen.availWidth,
                                    availHeight: window.screen.availHeight,
                                    colorDepth: window.screen.colorDepth,
                                    pixelDepth: window.screen.pixelDepth,
                                    devicePixelRatio: window.devicePixelRatio,
                                },
                                window: {
                                    innerWidth: window.innerWidth,
                                    innerHeight: window.innerHeight,
                                    outerWidth: window.outerWidth,
                                    outerHeight: window.outerHeight,
                                },
                                platform: navigator.platform,
                                timestamp: new Date().toISOString(),
                                timezoneOffset: new Date().getTimezoneOffset(),
                                referrer: document.referrer,
                                previousPage: window.history.length > 1 ? document.referrer : null,
                            }
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}`);
                    }

                    // Show success message
                    modal.classList.add('success');
                    const modalBody = modal.querySelector('.feedback-modal-body');
                    modalBody.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h4>Thank you!</h4>
                        <p>Your feedback has been submitted successfully.</p>
                    `;
                    
                    // Remove footer and make header unclickable
                    const modalFooter = modal.querySelector('.feedback-modal-footer');
                    const modalHeader = modal.querySelector('.feedback-modal-header');
                    modalFooter.style.display = 'none';
                    modalHeader.style.cursor = 'default';

                    // Close modal after delay
                    setTimeout(() => {
                        closeModal();
                        resetPosition();
                    }, 2000);

                } catch (error) {
                    console.error('Error submitting feedback:', error);
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = 'Failed to submit feedback. Please try again.';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit';
                }
            });
        }

        function closeModal() {
            const modal = document.querySelector('.feedback-modal');
            const overlay = document.querySelector('.modal-overlay');
            
            if (isMobile) {
                // Animate out
                if (modal) modal.classList.remove('visible');
                if (overlay) overlay.classList.remove('visible');
                
                // Wait for animation to complete before removing
                setTimeout(() => {
                    if (modal) modal.remove();
                    if (overlay) overlay.remove();
                    // Re-enable body scrolling
                    document.body.style.overflow = '';
                }, 300);
            } else {
                // Desktop - remove immediately
                if (modal) modal.remove();
                if (overlay) overlay.remove();
            }
        }
    }
})(); 
