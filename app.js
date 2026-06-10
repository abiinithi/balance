// Nothing OS Balance Widget Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const balanceAmountEl = document.getElementById('balance-amount');
  const widgetCard = document.getElementById('widget-card');
  const overlayIncoming = document.getElementById('overlay-incoming');
  const overlayOutgoing = document.getElementById('overlay-outgoing');
  
  // Inputs & Buttons
  const inputIncoming = document.getElementById('input-incoming');
  const inputOutgoing = document.getElementById('input-outgoing');
  const btnCloseIncoming = document.getElementById('btn-close-incoming');
  const btnCloseOutgoing = document.getElementById('btn-close-outgoing');
  const btnSubmitIncoming = document.getElementById('btn-submit-incoming');
  const btnSubmitOutgoing = document.getElementById('btn-submit-outgoing');
  
  // State
  let balance = 0;
  let isOverlayOpen = false;

  // Load Initial Balance
  const storedBalance = localStorage.getItem('balance');
  if (storedBalance !== null) {
    balance = parseFloat(storedBalance) || 0;
  }
  updateUI();

  // Helper: Format amount in Rupees
  function formatRupees(amount) {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    return `₹${formatted}`;
  }

  // Update Balance UI
  function updateUI() {
    balanceAmountEl.textContent = formatRupees(balance);
    
    // Scale text size if balance is very long to prevent overflow
    const length = balanceAmountEl.textContent.length;
    if (length > 12) {
      balanceAmountEl.style.fontSize = '24px';
    } else if (length > 8) {
      balanceAmountEl.style.fontSize = '30px';
    } else {
      balanceAmountEl.style.fontSize = '42px';
    }
  }

  // Save Balance to Local Storage
  function saveBalance() {
    localStorage.setItem('balance', balance.toString());
  }

  // Close overlays
  function closeOverlays() {
    overlayIncoming.classList.remove('active');
    overlayOutgoing.classList.remove('active');
    
    // Clean up inline transform styles left by drag tracking
    overlayIncoming.style.transform = '';
    overlayOutgoing.style.transform = '';
    overlayIncoming.style.transition = '';
    overlayOutgoing.style.transition = '';
    
    widgetCard.classList.remove('drag-up', 'drag-down');
    
    // Unfocus active inputs
    inputIncoming.blur();
    inputOutgoing.blur();
    
    // Reset values
    inputIncoming.value = '';
    inputOutgoing.value = '';
    
    isOverlayOpen = false;
  }

  // Open specific overlay
  function openOverlay(type) {
    if (isOverlayOpen) return;
    isOverlayOpen = true;

    if (type === 'incoming') {
      overlayIncoming.classList.add('active');
      overlayIncoming.style.transform = 'translateY(0)';
      setTimeout(() => {
        inputIncoming.focus();
      }, 150);
    } else if (type === 'outgoing') {
      overlayOutgoing.classList.add('active');
      overlayOutgoing.style.transform = 'translateY(0)';
      setTimeout(() => {
        inputOutgoing.focus();
      }, 150);
    }
  }

  // Add/Subtract operations
  function handleAdd() {
    const amount = parseFloat(inputIncoming.value);
    if (!isNaN(amount) && amount > 0) {
      balance += amount;
      saveBalance();
      updateUI();
    }
    closeOverlays();
  }

  function handleSubtract() {
    const amount = parseFloat(inputOutgoing.value);
    if (!isNaN(amount) && amount > 0) {
      balance -= amount;
      saveBalance();
      updateUI();
    }
    closeOverlays();
  }

  // Attach button click events
  btnCloseIncoming.addEventListener('click', closeOverlays);
  btnCloseOutgoing.addEventListener('click', closeOverlays);
  btnSubmitIncoming.addEventListener('click', handleAdd);
  btnSubmitOutgoing.addEventListener('click', handleSubtract);

  // Press Enter key to submit within input fields
  inputIncoming.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });
  inputOutgoing.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubtract();
  });

  // Touch and Mouse Gesture State Variables
  let startY = 0;
  let startX = 0;
  let currentY = 0;
  let currentX = 0;
  let isDragging = false;
  let cardHeight = widgetCard.offsetHeight;

  // Recalculate card height on resize (in case widget changes size)
  window.addEventListener('resize', () => {
    cardHeight = widgetCard.offsetHeight;
  });

  // Handle Drag Start
  function dragStart(e) {
    if (isOverlayOpen) return;
    
    // Determine if it's touch or mouse event
    const touch = e.touches ? e.touches[0] : e;
    startY = touch.clientY;
    startX = touch.clientX;
    isDragging = true;
    cardHeight = widgetCard.offsetHeight;
  }

  // Handle Drag Move
  function dragMove(e) {
    if (!isDragging || isOverlayOpen) return;

    const touch = e.touches ? e.touches[0] : e;
    currentY = touch.clientY;
    currentX = touch.clientX;

    const diffY = currentY - startY;
    const diffX = currentX - startX;

    // Check if swipe is primary vertical to avoid horizontal noise
    if (Math.abs(diffY) > Math.abs(diffX)) {
      e.preventDefault(); // Prevent page scrolling

      if (diffY > 0) {
        // Dragging DOWN -> Pulling down the INCOMING (Add) sheet
        widgetCard.classList.add('drag-down');
        widgetCard.classList.remove('drag-up');
        
        // Dynamic translate tracking: starts at -100% (-cardHeight) and approaches 0 as we pull
        const translateVal = Math.min(0, -cardHeight + diffY);
        overlayIncoming.style.transition = 'none';
        overlayIncoming.style.transform = `translateY(${translateVal}px)`;
      } else {
        // Dragging UP -> Pulling up the OUTGOING (Subtract) sheet
        widgetCard.classList.add('drag-up');
        widgetCard.classList.remove('drag-down');
        
        // Dynamic translate tracking: starts at 100% (cardHeight) and approaches 0 as we pull
        const translateVal = Math.max(0, cardHeight + diffY);
        overlayOutgoing.style.transition = 'none';
        overlayOutgoing.style.transform = `translateY(${translateVal}px)`;
      }
    }
  }

  // Handle Drag End
  function dragEnd() {
    if (!isDragging || isOverlayOpen) return;
    isDragging = false;

    const diffY = currentY - startY;
    const threshold = cardHeight * 0.25; // 25% of card height required to trigger

    // Reset transition styling so animations snap nicely
    overlayIncoming.style.transition = '';
    overlayOutgoing.style.transition = '';

    if (diffY > threshold && widgetCard.classList.contains('drag-down')) {
      // Swiped down successfully -> Open Incoming
      openOverlay('incoming');
    } else if (diffY < -threshold && widgetCard.classList.contains('drag-up')) {
      // Swiped up successfully -> Open Outgoing
      openOverlay('outgoing');
    } else {
      // Threshold not met -> bounce back
      closeOverlays();
    }
  }

  // Mobile Touch Event Listeners
  widgetCard.addEventListener('touchstart', dragStart, { passive: false });
  widgetCard.addEventListener('touchmove', dragMove, { passive: false });
  widgetCard.addEventListener('touchend', dragEnd);

  // Desktop Mouse Event Listeners (for development, simulator, and mouse widgets)
  widgetCard.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', (e) => {
    if (isDragging) dragMove(e);
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) dragEnd();
  });
});
