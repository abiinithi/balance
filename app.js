// Nothing OS Balance & Savings Buckets App Logic

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  
  // General Balance Elements
  const balanceAmountEl = document.getElementById('balance-amount');
  const widgetCard = document.getElementById('widget-card');
  const overlayIncoming = document.getElementById('overlay-incoming');
  const overlayOutgoing = document.getElementById('overlay-outgoing');
  const inputIncoming = document.getElementById('input-incoming');
  const inputOutgoing = document.getElementById('input-outgoing');
  const btnCloseIncoming = document.getElementById('btn-close-incoming');
  const btnCloseOutgoing = document.getElementById('btn-close-outgoing');
  const btnSubmitIncoming = document.getElementById('btn-submit-incoming');
  const btnSubmitOutgoing = document.getElementById('btn-submit-outgoing');

  // Savings Section Elements
  const bucketsListEl = document.getElementById('buckets-list');
  const btnAddBucket = document.getElementById('btn-add-bucket');

  // Create Bucket Overlay Elements
  const overlayCreateBucket = document.getElementById('overlay-create-bucket');
  const btnCloseCreateBucket = document.getElementById('btn-close-create-bucket');
  const btnSubmitCreateBucket = document.getElementById('btn-submit-create-bucket');
  const inputCreateBucketName = document.getElementById('input-create-bucket-name');

  // Manage Bucket Overlay Elements
  const overlayBucketManager = document.getElementById('overlay-bucket-manager');
  const btnCloseBucketManager = document.getElementById('btn-close-bucket-manager');
  const bucketManagerTitle = document.getElementById('bucket-manager-title');
  const inputBucketName = document.getElementById('input-bucket-name');
  const inputBucketAmount = document.getElementById('input-bucket-amount');
  const btnDeleteBucket = document.getElementById('btn-delete-bucket');
  const btnWithdrawBucket = document.getElementById('btn-withdraw-bucket');
  const btnDepositBucket = document.getElementById('btn-deposit-bucket');

  // --- State Variables ---
  let balance = 0;
  let buckets = [];
  let selectedBucketId = null;
  let isOverlayOpen = false;

  // --- Initialization ---
  
  // Load General Balance
  const storedBalance = localStorage.getItem('balance');
  if (storedBalance !== null) {
    balance = parseFloat(storedBalance) || 0;
  }

  // Load Savings Buckets
  const storedBuckets = localStorage.getItem('buckets');
  if (storedBuckets !== null) {
    try {
      buckets = JSON.parse(storedBuckets) || [];
    } catch (e) {
      buckets = [];
    }
  }

  // Render initial interface
  updateMainUI();
  renderBuckets();

  // --- Helper Functions ---

  // Generate simple unique ID
  function generateId() {
    return 'b_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  // Format currency in Rupees
  function formatRupees(amount) {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    return `₹${formatted}`;
  }

  // Update Main Balance Display & Text Sizing
  function updateMainUI() {
    balanceAmountEl.textContent = formatRupees(balance);
    
    const length = balanceAmountEl.textContent.length;
    if (length > 12) {
      balanceAmountEl.style.fontSize = '26px';
    } else if (length > 8) {
      balanceAmountEl.style.fontSize = '32px';
    } else {
      balanceAmountEl.style.fontSize = '42px';
    }
  }

  // Save State
  function saveState() {
    localStorage.setItem('balance', balance.toString());
    localStorage.setItem('buckets', JSON.stringify(buckets));
  }

  // Close All Overlays
  function closeAllOverlays() {
    // General Balance overlays
    overlayIncoming.classList.remove('active');
    overlayOutgoing.classList.remove('active');
    overlayIncoming.style.transform = '';
    overlayOutgoing.style.transform = '';
    overlayIncoming.style.transition = '';
    overlayOutgoing.style.transition = '';
    widgetCard.classList.remove('drag-up', 'drag-down');
    
    // Bucket overlays
    overlayCreateBucket.classList.remove('active');
    overlayBucketManager.classList.remove('active');

    // Unfocus active inputs
    inputIncoming.blur();
    inputOutgoing.blur();
    inputCreateBucketName.blur();
    inputBucketName.blur();
    inputBucketAmount.blur();

    // Reset Inputs
    inputIncoming.value = '';
    inputOutgoing.value = '';
    inputCreateBucketName.value = '';
    inputBucketName.value = '';
    inputBucketAmount.value = '';

    selectedBucketId = null;
    isOverlayOpen = false;
  }

  // Open general balance overlays
  function openGeneralOverlay(type) {
    if (isOverlayOpen) return;
    isOverlayOpen = true;

    if (type === 'incoming') {
      overlayIncoming.classList.add('active');
      overlayIncoming.style.transform = 'translateY(0)';
      setTimeout(() => inputIncoming.focus(), 150);
    } else if (type === 'outgoing') {
      overlayOutgoing.classList.add('active');
      overlayOutgoing.style.transform = 'translateY(0)';
      setTimeout(() => inputOutgoing.focus(), 150);
    }
  }

  // --- General Balance Operations ---

  function handleMainAdd() {
    const amount = parseFloat(inputIncoming.value);
    if (!isNaN(amount) && amount > 0) {
      balance += amount;
      saveState();
      updateMainUI();
    }
    closeAllOverlays();
  }

  function handleMainSubtract() {
    const amount = parseFloat(inputOutgoing.value);
    if (!isNaN(amount) && amount > 0) {
      balance -= amount;
      saveState();
      updateMainUI();
    }
    closeAllOverlays();
  }

  // General Balance Event Listeners
  btnCloseIncoming.addEventListener('click', closeAllOverlays);
  btnCloseOutgoing.addEventListener('click', closeAllOverlays);
  btnSubmitIncoming.addEventListener('click', handleMainAdd);
  btnSubmitOutgoing.addEventListener('click', handleMainSubtract);
  inputIncoming.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleMainAdd(); });
  inputOutgoing.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleMainSubtract(); });

  // --- Savings Buckets Rendering & DOM ---

  function renderBuckets() {
    bucketsListEl.innerHTML = '';
    
    if (buckets.length === 0) {
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.className = 'buckets-empty';
      emptyPlaceholder.textContent = 'NO SAVINGS BUCKETS';
      bucketsListEl.appendChild(emptyPlaceholder);
      return;
    }

    buckets.forEach(bucket => {
      const bucketItem = document.createElement('div');
      bucketItem.className = 'bucket-item';
      bucketItem.setAttribute('data-id', bucket.id);
      
      const nameEl = document.createElement('span');
      nameEl.className = 'bucket-name';
      nameEl.textContent = bucket.name;
      
      const balanceEl = document.createElement('span');
      balanceEl.className = 'bucket-balance';
      balanceEl.textContent = formatRupees(bucket.balance);
      
      bucketItem.appendChild(nameEl);
      bucketItem.appendChild(balanceEl);
      
      bucketItem.addEventListener('click', () => openBucketManager(bucket.id));
      
      bucketsListEl.appendChild(bucketItem);
    });
  }

  // --- Add Savings Bucket drawer ---

  btnAddBucket.addEventListener('click', () => {
    if (isOverlayOpen) return;
    isOverlayOpen = true;
    overlayCreateBucket.classList.add('active');
    setTimeout(() => inputCreateBucketName.focus(), 150);
  });

  btnCloseCreateBucket.addEventListener('click', closeAllOverlays);

  function handleCreateBucket() {
    const name = inputCreateBucketName.value.trim();
    if (name) {
      buckets.push({
        id: generateId(),
        name: name,
        balance: 0
      });
      saveState();
      renderBuckets();
    }
    closeAllOverlays();
  }

  btnSubmitCreateBucket.addEventListener('click', handleCreateBucket);
  inputCreateBucketName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCreateBucket();
  });

  // --- Manage Bucket Drawer ---

  function openBucketManager(id) {
    if (isOverlayOpen) return;
    isOverlayOpen = true;
    
    const bucket = buckets.find(b => b.id === id);
    if (!bucket) {
      isOverlayOpen = false;
      return;
    }

    selectedBucketId = id;
    bucketManagerTitle.textContent = `MANAGE: ${bucket.name}`;
    inputBucketName.value = bucket.name;
    inputBucketAmount.value = '';
    
    overlayBucketManager.classList.add('active');
    setTimeout(() => inputBucketAmount.focus(), 150);
  }

  btnCloseBucketManager.addEventListener('click', closeAllOverlays);

  // Rename Bucket logic on Blur
  inputBucketName.addEventListener('change', () => {
    if (!selectedBucketId) return;
    const bucket = buckets.find(b => b.id === selectedBucketId);
    const newName = inputBucketName.value.trim();
    if (bucket && newName) {
      bucket.name = newName;
      bucketManagerTitle.textContent = `MANAGE: ${newName}`;
      saveState();
      renderBuckets();
    }
  });

  // Deposit Money to Bucket
  function handleDeposit() {
    if (!selectedBucketId) return;
    const bucket = buckets.find(b => b.id === selectedBucketId);
    const amount = parseFloat(inputBucketAmount.value);
    if (bucket && !isNaN(amount) && amount > 0) {
      bucket.balance += amount;
      saveState();
      renderBuckets();
    }
    closeAllOverlays();
  }

  // Withdraw Money from Bucket
  function handleWithdraw() {
    if (!selectedBucketId) return;
    const bucket = buckets.find(b => b.id === selectedBucketId);
    const amount = parseFloat(inputBucketAmount.value);
    if (bucket && !isNaN(amount) && amount > 0) {
      bucket.balance -= amount;
      saveState();
      renderBuckets();
    }
    closeAllOverlays();
  }

  // Delete Bucket
  function handleDelete() {
    if (!selectedBucketId) return;
    buckets = buckets.filter(b => b.id !== selectedBucketId);
    saveState();
    renderBuckets();
    closeAllOverlays();
  }

  btnDepositBucket.addEventListener('click', handleDeposit);
  btnWithdrawBucket.addEventListener('click', handleWithdraw);
  btnDeleteBucket.addEventListener('click', handleDelete);
  inputBucketAmount.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleDeposit(); // Default enter key adds money
  });

  // --- Touch and Mouse Gestures for Top Card (General Balance Card) ---
  let startY = 0;
  let startX = 0;
  let currentY = 0;
  let currentX = 0;
  let isDragging = false;
  let cardHeight = widgetCard.offsetHeight;

  window.addEventListener('resize', () => {
    cardHeight = widgetCard.offsetHeight;
  });

  function dragStart(e) {
    if (isOverlayOpen) return;
    
    const touch = e.touches ? e.touches[0] : e;
    startY = touch.clientY;
    startX = touch.clientX;
    isDragging = true;
    cardHeight = widgetCard.offsetHeight;
  }

  function dragMove(e) {
    if (!isDragging || isOverlayOpen) return;

    const touch = e.touches ? e.touches[0] : e;
    currentY = touch.clientY;
    currentX = touch.clientX;

    const diffY = currentY - startY;
    const diffX = currentX - startX;

    // Verify it is primarily a vertical swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
      e.preventDefault();

      if (diffY > 0) {
        // Swipe Down -> Pull down Incoming sheet
        widgetCard.classList.add('drag-down');
        widgetCard.classList.remove('drag-up');
        
        const translateVal = Math.min(0, -cardHeight + diffY);
        overlayIncoming.style.transition = 'none';
        overlayIncoming.style.transform = `translateY(${translateVal}px)`;
      } else {
        // Swipe Up -> Pull up Outgoing sheet
        widgetCard.classList.add('drag-up');
        widgetCard.classList.remove('drag-down');
        
        const translateVal = Math.max(0, cardHeight + diffY);
        overlayOutgoing.style.transition = 'none';
        overlayOutgoing.style.transform = `translateY(${translateVal}px)`;
      }
    }
  }

  function dragEnd() {
    if (!isDragging || isOverlayOpen) return;
    isDragging = false;

    const diffY = currentY - startY;
    const threshold = cardHeight * 0.25;

    overlayIncoming.style.transition = '';
    overlayOutgoing.style.transition = '';

    if (diffY > threshold && widgetCard.classList.contains('drag-down')) {
      openGeneralOverlay('incoming');
    } else if (diffY < -threshold && widgetCard.classList.contains('drag-up')) {
      openGeneralOverlay('outgoing');
    } else {
      closeAllOverlays();
    }
  }

  // Attach drag events strictly to widgetCard (the general balance top card)
  widgetCard.addEventListener('touchstart', dragStart, { passive: false });
  widgetCard.addEventListener('touchmove', dragMove, { passive: false });
  widgetCard.addEventListener('touchend', dragEnd);

  widgetCard.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', (e) => {
    if (isDragging) dragMove(e);
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) dragEnd();
  });
});
