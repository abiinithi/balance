// Nothing OS Balance & Savings Buckets App Logic

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  
  // General Balance Elements
  const balanceAmountEl = document.getElementById('balance-amount');
  const widgetCard = document.getElementById('widget-card');
  const widgetBucketSelect = document.getElementById('widget-bucket-select');
  const overlayIncoming = document.getElementById('overlay-incoming');
  const overlayOutgoing = document.getElementById('overlay-outgoing');
  const inputIncoming = document.getElementById('input-incoming');
  const inputOutgoing = document.getElementById('input-outgoing');
  const btnCloseIncoming = document.getElementById('btn-close-incoming');
  const btnCloseOutgoing = document.getElementById('btn-close-outgoing');
  const btnSubmitIncoming = document.getElementById('btn-submit-incoming');
  const btnSubmitOutgoing = document.getElementById('btn-submit-outgoing');

  // Transaction Details Overlay
  const overlayTransactionDetails = document.getElementById('overlay-transaction-details');
  const btnCloseTransactionDetails = document.getElementById('btn-close-transaction-details');
  const selectTransactionBucket = document.getElementById('select-transaction-bucket');
  const inputTransactionNote = document.getElementById('input-transaction-note');
  const btnConfirmTransaction = document.getElementById('btn-confirm-transaction');

  // Savings Section Elements
  const bucketsListEl = document.getElementById('buckets-list');
  const btnAddBucket = document.getElementById('btn-add-bucket');

  // Create Bucket Overlay Elements
  const overlayCreateBucket = document.getElementById('overlay-create-bucket');
  const btnCloseCreateBucket = document.getElementById('btn-close-create-bucket');
  const btnSubmitCreateBucket = document.getElementById('btn-submit-create-bucket');
  const selectCreateBucketType = document.getElementById('select-create-bucket-type');
  const inputCreateBucketName = document.getElementById('input-create-bucket-name');
  const inputCreateBucketTarget = document.getElementById('input-create-bucket-target');

  // Manage Bucket Overlay Elements
  const overlayBucketManager = document.getElementById('overlay-bucket-manager');
  const btnCloseBucketManager = document.getElementById('btn-close-bucket-manager');
  const bucketManagerTitle = document.getElementById('bucket-manager-title');
  const inputBucketName = document.getElementById('input-bucket-name');
  const inputBucketTarget = document.getElementById('input-bucket-target');
  const inputBucketAmount = document.getElementById('input-bucket-amount');
  const btnDeleteBucket = document.getElementById('btn-delete-bucket');
  const btnWithdrawBucket = document.getElementById('btn-withdraw-bucket');
  const btnDepositBucket = document.getElementById('btn-deposit-bucket');

  // Month-End Resolution Elements
  const overlayMonthEnd = document.getElementById('overlay-month-end');
  const resolutionBucketsContainer = document.getElementById('resolution-buckets-container');
  const btnCompleteResolution = document.getElementById('btn-complete-resolution');

  // Navigation Elements
  const tabDashboard = document.getElementById('tab-dashboard');
  const tabHistory = document.getElementById('tab-history');
  const navDashboard = document.getElementById('nav-dashboard');
  const navHistory = document.getElementById('nav-history');
  const historyListEl = document.getElementById('history-list');

  // --- State Variables ---
  let buckets = [];
  let transactions = [];
  let currentMonth = ''; // e.g. "2026-07"
  
  let selectedBucketId = null;
  let isOverlayOpen = false;
  
  // Pending transaction state from main widget swipe
  let pendingAmount = 0;
  let pendingType = null; // 'deposit' or 'withdraw'

  // --- Initialization ---
  
  // Load State
  const storedBuckets = localStorage.getItem('buckets');
  if (storedBuckets) {
    try { buckets = JSON.parse(storedBuckets) || []; } catch (e) { buckets = []; }
  }
  
  const storedTransactions = localStorage.getItem('transactions');
  if (storedTransactions) {
    try { transactions = JSON.parse(storedTransactions) || []; } catch (e) { transactions = []; }
  }

  const storedMonth = localStorage.getItem('currentMonth');
  const today = new Date();
  const realCurrentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  if (!storedMonth) {
    currentMonth = realCurrentMonth;
    saveState();
  } else {
    currentMonth = storedMonth;
  }

  // --- Helper Functions ---

  function generateId() {
    return 'b_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  function formatRupees(amount) {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    return `₹${formatted}`;
  }

  function saveState() {
    localStorage.setItem('buckets', JSON.stringify(buckets));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('currentMonth', currentMonth);
  }

  // Check for Month-End Resolution
  if (currentMonth !== realCurrentMonth) {
    initMonthEndResolution(realCurrentMonth);
  } else {
    initApp();
  }

  function initApp() {
    populateBucketSelects();
    updateMainUI();
    renderBuckets();
    renderTransactions();
  }

  // --- Tab Navigation Logic ---
  navDashboard.addEventListener('click', () => {
    navDashboard.classList.add('active');
    navHistory.classList.remove('active');
    tabDashboard.classList.add('active');
    tabHistory.classList.remove('active');
  });

  navHistory.addEventListener('click', () => {
    navHistory.classList.add('active');
    navDashboard.classList.remove('active');
    tabHistory.classList.add('active');
    tabDashboard.classList.remove('active');
    renderTransactions();
  });

  function populateBucketSelects() {
    // Populate Main Widget Select
    const currentWidgetSelection = widgetBucketSelect.value;
    widgetBucketSelect.innerHTML = '<option value="total">TOTAL BALANCE</option>';
    
    // Populate Transaction Dropdown
    selectTransactionBucket.innerHTML = '';
    
    if (buckets.length === 0) {
      const opt = document.createElement('option');
      opt.value = "";
      opt.textContent = "No buckets available";
      selectTransactionBucket.appendChild(opt);
    } else {
      buckets.forEach(b => {
        const optW = document.createElement('option');
        optW.value = b.id;
        optW.textContent = b.name.toUpperCase();
        widgetBucketSelect.appendChild(optW);
        
        const optT = document.createElement('option');
        optT.value = b.id;
        optT.textContent = b.name;
        selectTransactionBucket.appendChild(optT);
      });
    }
    
    // Restore selection if exists
    if (currentWidgetSelection && Array.from(widgetBucketSelect.options).some(o => o.value === currentWidgetSelection)) {
      widgetBucketSelect.value = currentWidgetSelection;
    }
  }

  // Update Main Balance Display & Text Sizing
  function updateMainUI() {
    let displayValue = 0;
    const selected = widgetBucketSelect.value;
    
    if (selected === 'total') {
      // Total Remaining Budget = Sum of (target - spent) for all budget buckets
      displayValue = buckets
        .filter(b => b.type === 'budget')
        .reduce((acc, b) => acc + (b.targetAmount - b.currentAmount), 0);
    } else {
      const bucket = buckets.find(b => b.id === selected);
      if (bucket) {
        if (bucket.type === 'budget') {
          displayValue = bucket.targetAmount - bucket.currentAmount;
        } else {
          displayValue = bucket.currentAmount;
        }
      }
    }

    balanceAmountEl.textContent = formatRupees(displayValue);
    
    const length = balanceAmountEl.textContent.length;
    if (length > 12) {
      balanceAmountEl.style.fontSize = '26px';
    } else if (length > 8) {
      balanceAmountEl.style.fontSize = '32px';
    } else {
      balanceAmountEl.style.fontSize = '42px';
    }
  }

  widgetBucketSelect.addEventListener('change', updateMainUI);

  // Close All Overlays
  function closeAllOverlays() {
    overlayIncoming.classList.remove('active');
    overlayOutgoing.classList.remove('active');
    overlayTransactionDetails.classList.remove('active');
    
    overlayIncoming.style.transform = '';
    overlayOutgoing.style.transform = '';
    
    widgetCard.classList.remove('drag-up', 'drag-down');
    
    overlayCreateBucket.classList.remove('active');
    overlayBucketManager.classList.remove('active');

    // Unfocus and reset
    inputIncoming.blur();
    inputOutgoing.blur();
    inputTransactionNote.blur();
    inputCreateBucketName.blur();
    inputCreateBucketTarget.blur();
    inputBucketName.blur();
    inputBucketTarget.blur();
    inputBucketAmount.blur();

    inputIncoming.value = '';
    inputOutgoing.value = '';
    inputTransactionNote.value = '';
    inputCreateBucketName.value = '';
    inputCreateBucketTarget.value = '';
    inputBucketName.value = '';
    inputBucketTarget.value = '';
    inputBucketAmount.value = '';

    selectedBucketId = null;
    isOverlayOpen = false;
    pendingAmount = 0;
    pendingType = null;
  }

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

  // --- Transaction Logic ---

  function processTransaction(bucketId, amount, type, note) {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;

    // Create transaction record
    transactions.push({
      id: generateId(),
      bucketId,
      amount,
      type,
      note,
      date: new Date().toISOString()
    });

    // Update bucket currentAmount
    if (bucket.type === 'budget') {
      // For budget: withdraw = spent money (+), deposit = refund (-)
      if (type === 'withdraw') bucket.currentAmount += amount;
      if (type === 'deposit') bucket.currentAmount -= amount;
    } else {
      // For saving: deposit = money added (+), withdraw = money removed (-)
      if (type === 'deposit') bucket.currentAmount += amount;
      if (type === 'withdraw') bucket.currentAmount -= amount;
    }

    saveState();
    populateBucketSelects();
    updateMainUI();
    renderBuckets();
    renderTransactions();
  }

  // Main Widget Swipe Input Actions
  function handleMainAmountEntered(type) {
    const amount = type === 'deposit' ? parseFloat(inputIncoming.value) : parseFloat(inputOutgoing.value);
    if (isNaN(amount) || amount <= 0) {
      closeAllOverlays();
      return;
    }
    
    if (buckets.length === 0) {
      alert("Please create a bucket first!");
      closeAllOverlays();
      return;
    }

    pendingAmount = amount;
    pendingType = type;
    
    // Switch to details overlay
    overlayIncoming.classList.remove('active');
    overlayOutgoing.classList.remove('active');
    overlayTransactionDetails.classList.add('active');
    
    // Auto-select the currently viewed bucket if one is selected
    if (widgetBucketSelect.value !== 'total') {
      selectTransactionBucket.value = widgetBucketSelect.value;
    }
    
    setTimeout(() => inputTransactionNote.focus(), 150);
  }

  btnSubmitIncoming.addEventListener('click', () => handleMainAmountEntered('deposit'));
  btnSubmitOutgoing.addEventListener('click', () => handleMainAmountEntered('withdraw'));
  inputIncoming.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleMainAmountEntered('deposit'); });
  inputOutgoing.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleMainAmountEntered('withdraw'); });

  // Transaction Details Confirmation
  btnConfirmTransaction.addEventListener('click', () => {
    const bucketId = selectTransactionBucket.value;
    const note = inputTransactionNote.value.trim();
    if (!bucketId) return;
    
    processTransaction(bucketId, pendingAmount, pendingType, note);
    closeAllOverlays();
  });
  
  inputTransactionNote.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnConfirmTransaction.click();
  });

  btnCloseIncoming.addEventListener('click', closeAllOverlays);
  btnCloseOutgoing.addEventListener('click', closeAllOverlays);
  btnCloseTransactionDetails.addEventListener('click', closeAllOverlays);

  // --- Savings Buckets Rendering ---

  function renderBuckets() {
    bucketsListEl.innerHTML = '';
    
    if (buckets.length === 0) {
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.className = 'buckets-empty';
      emptyPlaceholder.textContent = 'NO BUCKETS YET';
      bucketsListEl.appendChild(emptyPlaceholder);
      return;
    }

    buckets.forEach(bucket => {
      const bucketItem = document.createElement('div');
      bucketItem.className = 'bucket-item';
      bucketItem.setAttribute('data-id', bucket.id);
      
      const leftCol = document.createElement('div');
      leftCol.style.display = 'flex';
      leftCol.style.flexDirection = 'column';
      
      const nameEl = document.createElement('span');
      nameEl.className = 'bucket-name';
      nameEl.textContent = bucket.name;
      
      const typeEl = document.createElement('span');
      typeEl.style.fontFamily = 'var(--font-sans)';
      typeEl.style.fontSize = '9px';
      typeEl.style.color = 'var(--text-secondary)';
      typeEl.style.marginTop = '4px';
      typeEl.textContent = bucket.type.toUpperCase();
      
      leftCol.appendChild(nameEl);
      leftCol.appendChild(typeEl);
      
      const rightCol = document.createElement('div');
      rightCol.style.display = 'flex';
      rightCol.style.flexDirection = 'column';
      rightCol.style.alignItems = 'flex-end';
      
      const balanceEl = document.createElement('span');
      balanceEl.className = 'bucket-balance';
      
      const detailEl = document.createElement('span');
      detailEl.style.fontFamily = 'var(--font-sans)';
      detailEl.style.fontSize = '9px';
      detailEl.style.color = 'var(--text-secondary)';
      detailEl.style.marginTop = '4px';

      if (bucket.type === 'budget') {
        const remaining = bucket.targetAmount - bucket.currentAmount;
        balanceEl.textContent = formatRupees(remaining);
        detailEl.textContent = `REMAINING OF ${formatRupees(bucket.targetAmount)}`;
      } else {
        balanceEl.textContent = formatRupees(bucket.currentAmount);
        const pct = bucket.targetAmount > 0 ? Math.round((bucket.currentAmount / bucket.targetAmount) * 100) : 0;
        detailEl.textContent = `${pct}% OF ${formatRupees(bucket.targetAmount)}`;
      }
      
      rightCol.appendChild(balanceEl);
      rightCol.appendChild(detailEl);
      
      bucketItem.appendChild(leftCol);
      bucketItem.appendChild(rightCol);
      
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
    const type = selectCreateBucketType.value;
    const name = inputCreateBucketName.value.trim();
    const targetAmount = parseFloat(inputCreateBucketTarget.value) || 0;
    
    if (name) {
      buckets.push({
        id: generateId(),
        name: name,
        type: type,
        targetAmount: targetAmount,
        currentAmount: 0
      });
      saveState();
      populateBucketSelects();
      updateMainUI();
      renderBuckets();
    }
    closeAllOverlays();
  }

  btnSubmitCreateBucket.addEventListener('click', handleCreateBucket);

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
    inputBucketTarget.value = bucket.targetAmount;
    inputBucketAmount.value = '';
    
    overlayBucketManager.classList.add('active');
    setTimeout(() => inputBucketAmount.focus(), 150);
  }

  btnCloseBucketManager.addEventListener('click', closeAllOverlays);

  function updateBucketDetails() {
    if (!selectedBucketId) return;
    const bucket = buckets.find(b => b.id === selectedBucketId);
    const newName = inputBucketName.value.trim();
    const newTarget = parseFloat(inputBucketTarget.value);
    
    if (bucket && newName) bucket.name = newName;
    if (bucket && !isNaN(newTarget)) bucket.targetAmount = newTarget;
    
    bucketManagerTitle.textContent = `MANAGE: ${bucket.name}`;
    saveState();
    populateBucketSelects();
    updateMainUI();
    renderBuckets();
  }

  inputBucketName.addEventListener('change', updateBucketDetails);
  inputBucketTarget.addEventListener('change', updateBucketDetails);

  function handleManagerAction(type) {
    if (!selectedBucketId) return;
    const amount = parseFloat(inputBucketAmount.value);
    if (!isNaN(amount) && amount > 0) {
      processTransaction(selectedBucketId, amount, type, 'Direct adjustment');
    }
    closeAllOverlays();
  }

  btnDepositBucket.addEventListener('click', () => handleManagerAction('deposit'));
  btnWithdrawBucket.addEventListener('click', () => handleManagerAction('withdraw'));

  btnDeleteBucket.addEventListener('click', () => {
    if (!selectedBucketId) return;
    buckets = buckets.filter(b => b.id !== selectedBucketId);
    
    // Also remove associated transactions
    transactions = transactions.filter(t => t.bucketId !== selectedBucketId);
    
    saveState();
    populateBucketSelects();
    updateMainUI();
    renderBuckets();
    renderTransactions();
    closeAllOverlays();
  });

  // --- Transaction History Logic ---

  function renderTransactions() {
    historyListEl.innerHTML = '';
    
    if (transactions.length === 0) {
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.className = 'buckets-empty';
      emptyPlaceholder.textContent = 'NO TRANSACTIONS';
      historyListEl.appendChild(emptyPlaceholder);
      return;
    }

    // Sort newest first
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(t => {
      const bucket = buckets.find(b => b.id === t.bucketId);
      const bucketName = bucket ? bucket.name.toUpperCase() : 'DELETED BUCKET';
      
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const leftCol = document.createElement('div');
      leftCol.className = 'history-item-left';
      
      const dateEl = document.createElement('span');
      dateEl.className = 'history-date';
      const d = new Date(t.date);
      dateEl.textContent = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const noteEl = document.createElement('span');
      noteEl.className = 'history-note';
      noteEl.textContent = t.note || 'No note';
      
      const bucketEl = document.createElement('span');
      bucketEl.className = 'history-bucket';
      bucketEl.textContent = bucketName;
      
      leftCol.appendChild(dateEl);
      leftCol.appendChild(noteEl);
      leftCol.appendChild(bucketEl);
      
      const rightCol = document.createElement('div');
      rightCol.className = 'history-item-right';
      
      const amtEl = document.createElement('span');
      amtEl.className = 'history-amount ' + t.type;
      amtEl.textContent = (t.type === 'deposit' ? '+' : '-') + formatRupees(t.amount);
      
      const delBtn = document.createElement('button');
      delBtn.className = 'history-delete';
      delBtn.textContent = 'DELETE';
      delBtn.addEventListener('click', () => deleteTransaction(t.id));
      
      rightCol.appendChild(amtEl);
      rightCol.appendChild(delBtn);
      
      item.appendChild(leftCol);
      item.appendChild(rightCol);
      
      historyListEl.appendChild(item);
    });
  }

  function deleteTransaction(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    
    // Revert impact
    const bucket = buckets.find(b => b.id === t.bucketId);
    if (bucket) {
      if (bucket.type === 'budget') {
        if (t.type === 'withdraw') bucket.currentAmount -= t.amount;
        if (t.type === 'deposit') bucket.currentAmount += t.amount;
      } else {
        if (t.type === 'deposit') bucket.currentAmount -= t.amount;
        if (t.type === 'withdraw') bucket.currentAmount += t.amount;
      }
    }
    
    transactions = transactions.filter(x => x.id !== id);
    saveState();
    populateBucketSelects();
    updateMainUI();
    renderBuckets();
    renderTransactions();
  }

  // --- Month-End Resolution Flow ---
  
  function initMonthEndResolution(newMonthStr) {
    isOverlayOpen = true;
    
    // Find budget buckets with leftover
    const leftoverBuckets = buckets.filter(b => b.type === 'budget' && (b.targetAmount - b.currentAmount) > 0);
    
    if (leftoverBuckets.length === 0) {
      // No resolution needed
      completeMonthChange(newMonthStr);
      return;
    }

    // Show overlay
    overlayMonthEnd.classList.add('active');
    resolutionBucketsContainer.innerHTML = '';
    
    const resolutionState = {};
    
    const savingBuckets = buckets.filter(b => b.type === 'saving');
    
    leftoverBuckets.forEach(b => {
      const leftover = b.targetAmount - b.currentAmount;
      resolutionState[b.id] = { action: null, targetId: null, amount: leftover };
      
      const box = document.createElement('div');
      box.className = 'resolution-box';
      
      const header = document.createElement('div');
      header.className = 'resolution-box-header';
      
      const nameEl = document.createElement('span');
      nameEl.textContent = b.name;
      const amtEl = document.createElement('span');
      amtEl.className = 'resolution-box-balance';
      amtEl.textContent = formatRupees(leftover);
      
      header.appendChild(nameEl);
      header.appendChild(amtEl);
      box.appendChild(header);
      
      // Select action
      const selectAction = document.createElement('select');
      selectAction.className = 'text-input';
      selectAction.innerHTML = `
        <option value="" disabled selected>Choose action...</option>
        <option value="rollover">Rollover to next month target</option>
        ${savingBuckets.length > 0 ? '<option value="transfer">Transfer to Saving bucket...</option>' : ''}
      `;
      box.appendChild(selectAction);
      
      const selectTarget = document.createElement('select');
      selectTarget.className = 'text-input';
      selectTarget.style.display = 'none';
      selectTarget.innerHTML = '<option value="" disabled selected>Select saving bucket...</option>';
      savingBuckets.forEach(sb => {
        selectTarget.innerHTML += `<option value="${sb.id}">${sb.name}</option>`;
      });
      box.appendChild(selectTarget);
      
      selectAction.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'transfer') {
          selectTarget.style.display = 'block';
          resolutionState[b.id].action = 'transfer';
          resolutionState[b.id].targetId = selectTarget.value || null;
        } else {
          selectTarget.style.display = 'none';
          resolutionState[b.id].action = 'rollover';
          resolutionState[b.id].targetId = null;
        }
        checkResolutionComplete();
      });
      
      selectTarget.addEventListener('change', (e) => {
        resolutionState[b.id].targetId = e.target.value;
        checkResolutionComplete();
      });
      
      resolutionBucketsContainer.appendChild(box);
    });
    
    function checkResolutionComplete() {
      const isComplete = Object.values(resolutionState).every(s => 
        s.action === 'rollover' || (s.action === 'transfer' && s.targetId)
      );
      btnCompleteResolution.disabled = !isComplete;
    }
    
    btnCompleteResolution.addEventListener('click', () => {
      // Apply resolutions
      Object.entries(resolutionState).forEach(([bucketId, state]) => {
        const sourceBucket = buckets.find(b => b.id === bucketId);
        if (!sourceBucket) return;
        
        if (state.action === 'rollover') {
          sourceBucket.targetAmount += state.amount;
        } else if (state.action === 'transfer') {
          const targetBucket = buckets.find(b => b.id === state.targetId);
          if (targetBucket) {
            targetBucket.currentAmount += state.amount;
          }
        }
      });
      
      completeMonthChange(newMonthStr);
    });
  }
  
  function completeMonthChange(newMonthStr) {
    // 1. Clear prior month transactions (only keeping saving bucket history if desired, but request says: "all transactions for the prior month are cleared to reset budget buckets")
    // Note: To be safe, we just clear all transactions to match "transactions are visible only for the current month"
    transactions = [];
    
    // 2. Reset budget buckets
    buckets.forEach(b => {
      if (b.type === 'budget') {
        b.currentAmount = 0; // reset spent to 0
      }
    });
    
    // 3. Update month
    currentMonth = newMonthStr;
    saveState();
    
    // 4. Start app
    overlayMonthEnd.classList.remove('active');
    isOverlayOpen = false;
    initApp();
  }

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
    
    // ignore if touching the select element
    if (e.target === widgetBucketSelect) return;
    
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

    if (Math.abs(diffY) > Math.abs(diffX)) {
      e.preventDefault();

      if (diffY > 0) {
        widgetCard.classList.add('drag-down');
        widgetCard.classList.remove('drag-up');
        const translateVal = Math.min(0, -cardHeight + diffY);
        overlayIncoming.style.transition = 'none';
        overlayIncoming.style.transform = `translateY(${translateVal}px)`;
      } else {
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
