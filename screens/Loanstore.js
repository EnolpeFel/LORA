/**
 * LoanStore.js — Lora Finance shared in-memory store
 *
 * Pre-seeded with demo history (1 Completed loan, 1 Failed loan).
 * New loans committed via commitLoanApplication() from LoanApplicationScreen.
 *
 * WALLET: walletBalance is managed here so Dashboard, CurrentLoan,
 *         and all screens share the same live balance.
 *
 * Interest rate convention
 *   All interestRate values stored are ANNUAL % (e.g. 90 = 90% p.a.).
 *   Lender interestRateVal is monthly (e.g. 0.075 = 7.5%/month), so we
 *   multiply by 12 before storing so CurrentLoanScreen's (rate/100/12) gives
 *   the correct monthly decimal.
 */

// ─── Credit Tier System ────────────────────────────────────────────────────────
export const CREDIT_TIERS = [
  { min: 200, max: 299, maxLoan: 5000,  label: 'Starter', color: '#6B7280', bg: '#F3F4F6', icon: 'remove-circle-outline' },
  { min: 300, max: 399, maxLoan: 10000, label: 'Bronze',  color: '#F59E0B', bg: '#FFFBEB', icon: 'trending-up-outline'   },
  { min: 400, max: 499, maxLoan: 20000, label: 'Silver',  color: '#8B5CF6', bg: '#EDE9FE', icon: 'star-outline'          },
  { min: 500, max: 850, maxLoan: 50000, label: 'Gold',    color: '#10B981', bg: '#ECFDF5', icon: 'ribbon-outline'        },
];

export const getCreditTier = (score) =>
  CREDIT_TIERS.find(t => score >= t.min && score <= t.max) || CREDIT_TIERS[0];

export const fmtCurrency = (n) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Seed history — static demo loans (Completed + Failed) ───────────────────
const _COMPLETED_PAYMENTS = [
  { id: '1',  date: 'April 5, 2023',     amount: 4735.13, principal: 3672.63, interest: 1062.50, method: 'GCash',         referenceNo: 'TXN-001-2023' },
  { id: '2',  date: 'May 5, 2023',       amount: 4735.13, principal: 3698.64, interest: 1036.49, method: 'Lora Wallet',   referenceNo: 'TXN-002-2023' },
  { id: '3',  date: 'June 5, 2023',      amount: 4735.13, principal: 3724.84, interest: 1010.29, method: 'Bank Transfer', referenceNo: 'TXN-003-2023' },
  { id: '4',  date: 'July 5, 2023',      amount: 4735.13, principal: 3751.23, interest:  983.90, method: 'BDO Online',    referenceNo: 'TXN-004-2023' },
  { id: '5',  date: 'August 5, 2023',    amount: 4735.13, principal: 3777.80, interest:  957.33, method: 'GCash',         referenceNo: 'TXN-005-2023' },
  { id: '6',  date: 'September 5, 2023', amount: 4735.13, principal: 3804.56, interest:  930.57, method: 'Lora Wallet',   referenceNo: 'TXN-006-2023' },
  { id: '7',  date: 'October 5, 2023',   amount: 4735.13, principal: 3831.51, interest:  903.62, method: 'Bank Transfer', referenceNo: 'TXN-007-2023' },
  { id: '8',  date: 'November 5, 2023',  amount: 4735.13, principal: 3858.65, interest:  876.48, method: 'BDO Online',    referenceNo: 'TXN-008-2023' },
  { id: '9',  date: 'December 5, 2023',  amount: 4735.13, principal: 3885.98, interest:  849.15, method: 'GCash',         referenceNo: 'TXN-009-2023' },
  { id: '10', date: 'January 5, 2024',   amount: 4735.13, principal: 3913.50, interest:  821.63, method: 'Lora Wallet',   referenceNo: 'TXN-010-2023' },
  { id: '11', date: 'February 5, 2024',  amount: 4735.13, principal: 3941.23, interest:  793.90, method: 'Bank Transfer', referenceNo: 'TXN-011-2023' },
  { id: '12', date: 'March 5, 2024',     amount: 4735.13, principal: 3969.14, interest:  765.99, method: 'BDO Online',    referenceNo: 'TXN-012-2023' },
  { id: '13', date: 'April 5, 2024',     amount: 4735.13, principal: 3997.26, interest:  737.87, method: 'GCash',         referenceNo: 'TXN-013-2023' },
  { id: '14', date: 'May 5, 2024',       amount: 4735.13, principal: 4025.57, interest:  709.56, method: 'Lora Wallet',   referenceNo: 'TXN-014-2023' },
  { id: '15', date: 'June 5, 2024',      amount: 4735.13, principal: 4054.09, interest:  681.04, method: 'Bank Transfer', referenceNo: 'TXN-015-2023' },
  { id: '16', date: 'July 5, 2024',      amount: 4735.13, principal: 4082.80, interest:  652.33, method: 'BDO Online',    referenceNo: 'TXN-016-2023' },
  { id: '17', date: 'August 5, 2024',    amount: 4735.13, principal: 4111.72, interest:  623.41, method: 'GCash',         referenceNo: 'TXN-017-2023' },
  { id: '18', date: 'September 5, 2024', amount: 4735.13, principal: 4140.85, interest:  594.28, method: 'Lora Wallet',   referenceNo: 'TXN-018-2023' },
  { id: '19', date: 'October 5, 2024',   amount: 4735.13, principal: 4170.18, interest:  564.95, method: 'Bank Transfer', referenceNo: 'TXN-019-2023' },
  { id: '20', date: 'November 5, 2024',  amount: 4735.13, principal: 4199.72, interest:  535.41, method: 'BDO Online',    referenceNo: 'TXN-020-2023' },
  { id: '21', date: 'December 5, 2024',  amount: 4735.13, principal: 4229.46, interest:  505.67, method: 'GCash',         referenceNo: 'TXN-021-2023' },
  { id: '22', date: 'January 5, 2025',   amount: 4735.13, principal: 4259.42, interest:  475.71, method: 'Lora Wallet',   referenceNo: 'TXN-022-2023' },
  { id: '23', date: 'February 5, 2025',  amount: 4735.13, principal: 4289.59, interest:  445.54, method: 'Bank Transfer', referenceNo: 'TXN-023-2023' },
  { id: '24', date: 'March 5, 2025',     amount: 4735.13, principal: 4319.98, interest:  415.15, method: 'BDO Online',    referenceNo: 'TXN-024-2023' },
  { id: '25', date: 'April 5, 2025',     amount: 4735.13, principal: 4350.58, interest:  384.55, method: 'GCash',         referenceNo: 'TXN-025-2023' },
  { id: '26', date: 'May 5, 2025',       amount: 4735.13, principal: 4381.39, interest:  353.74, method: 'Lora Wallet',   referenceNo: 'TXN-026-2023' },
  { id: '27', date: 'June 5, 2025',      amount: 4735.13, principal: 4412.43, interest:  322.70, method: 'Bank Transfer', referenceNo: 'TXN-027-2023' },
  { id: '28', date: 'July 5, 2025',      amount: 4735.13, principal: 4443.68, interest:  291.45, method: 'BDO Online',    referenceNo: 'TXN-028-2023' },
  { id: '29', date: 'August 5, 2025',    amount: 4735.13, principal: 4475.16, interest:  259.97, method: 'GCash',         referenceNo: 'TXN-029-2023' },
  { id: '30', date: 'September 5, 2025', amount: 4735.13, principal: 4506.86, interest:  228.27, method: 'Lora Wallet',   referenceNo: 'TXN-030-2023' },
  { id: '31', date: 'October 5, 2025',   amount: 4735.13, principal: 4538.78, interest:  196.35, method: 'Bank Transfer', referenceNo: 'TXN-031-2023' },
  { id: '32', date: 'November 5, 2025',  amount: 4735.13, principal: 4570.93, interest:  164.20, method: 'BDO Online',    referenceNo: 'TXN-032-2023' },
  { id: '33', date: 'December 5, 2025',  amount: 4735.13, principal: 4603.31, interest:  131.82, method: 'GCash',         referenceNo: 'TXN-033-2023' },
  { id: '34', date: 'January 5, 2026',   amount: 4735.13, principal: 4635.92, interest:   99.21, method: 'Lora Wallet',   referenceNo: 'TXN-034-2023' },
  { id: '35', date: 'February 5, 2026',  amount: 4735.13, principal: 4668.75, interest:   66.38, method: 'Bank Transfer', referenceNo: 'TXN-035-2023' },
  { id: '36', date: 'March 5, 2026',     amount: 4735.13, principal: 4701.83, interest:   33.30, method: 'Lora Wallet',   referenceNo: 'TXN-036-2023' },
];

const _SEED_COMPLETED_LOAN = {
  id:                'LN-2023-001',
  type:              'Personal Loan',
  lender:            'OCS Lending Incorporated',
  status:            'Completed',
  applicationDate:   'March 28, 2023',
  loanStartDate:     'April 1, 2023',
  loanEndDate:       'March 5, 2026',
  dueDate:           'March 5, 2026',
  nextDueDate:       'March 5, 2026',
  amount:            150000,
  netRelease:        149250,
  processingFee:     750,
  interestRate:      8.5,
  interestType:      'Diminishing',
  totalInterest:     20464.70,
  totalPayable:      170464.70,
  monthlyPayment:    4735.13,
  term:              36,
  remainingBalance:  0,
  paidAmount:        170464.70,
  paymentsCompleted: 36,
  paymentsRemaining: 0,
  purpose:           'Business Capital',
  collateral:        'ATM Card',
  monthlyIncome:     '₱50,000.00 / month',
  officerName:       'Maria Santos',
  officerContact:    '+63 912 345 6789',
  branchName:        'OCS Lending – Cebu Branch',
  branchAddress:     '123 Colon Street, Cebu City',
  creditScore:       560,
  creditTier:        'Gold',
};

const _SEED_FAILED_LOAN = {
  id:                'LN-2022-009',
  type:              'Business Loan',
  lender:            'San Hec Bro Lending Inc.',
  status:            'Failed',
  applicationDate:   'November 12, 2022',
  loanStartDate:     'November 12, 2022',
  loanEndDate:       '—',
  dueDate:           '—',
  nextDueDate:       '—',
  amount:            80000,
  netRelease:        0,
  processingFee:     500,
  interestRate:      5,
  interestType:      'Diminishing',
  totalInterest:     0,
  totalPayable:      0,
  monthlyPayment:    0,
  term:              24,
  remainingBalance:  0,
  paidAmount:        0,
  paymentsCompleted: 0,
  paymentsRemaining: 24,
  purpose:           'Business Capital',
  collateral:        'None',
  monthlyIncome:     '₱35,000.00 / month',
  officerName:       '—',
  officerContact:    '—',
  branchName:        '—',
  branchAddress:     '—',
  failureReason:     'Insufficient income relative to requested loan amount. DTI ratio exceeded 60%. Please reduce the loan amount or provide additional income documentation.',
  failureDate:       'November 18, 2022',
  creditScore:       320,
  creditTier:        'Bronze',
};

const _SEED_TRANSACTIONS = [
  {
    id: 'TX-SEED-DISB-001', transactionId: 'TX-SEED-DISB-001',
    type: 'Loan Disbursement', status: 'Completed',
    amount: '149,250.00', amountNum: 149250,
    date: 'April 1, 2023', time: '09:00 AM',
    paymentMethod: 'Direct Disbursement',
    loanId: 'LN-2023-001', loanType: 'Personal Loan',
    lender: 'OCS Lending Incorporated', applicationDate: 'March 28, 2023',
    loanAmount: 150000, term: '36 months',
    interestRate: 8.5, interestType: 'Diminishing',
    totalInterest: 20464.70, processingFee: 750, netRelease: 149250,
    creditPointsEarned: 5,
  },
  ..._COMPLETED_PAYMENTS.map((p, i) => ({
    id:               `TX-SEED-PAY-${String(i + 1).padStart(3, '0')}`,
    transactionId:    p.referenceNo,
    type:             'Payment',
    status:           'Completed',
    amount:           p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
    amountNum:        p.amount,
    principal:        p.principal,
    interest:         p.interest,
    date:             p.date,
    time:             '10:00 AM',
    paymentMethod:    p.method,
    loanId:           'LN-2023-001',
    loanType:         'Personal Loan',
    lender:           'OCS Lending Incorporated',
    applicationDate:  'March 28, 2023',
    creditPointsEarned: 20,
  })),
  {
    id: 'TX-SEED-FAIL-001', transactionId: 'TX-SEED-FAIL-001',
    type: 'Loan Disbursement', status: 'Failed',
    amount: '0.00', amountNum: 0,
    date: 'November 18, 2022', time: '02:30 PM',
    paymentMethod: 'N/A',
    failureReason: 'Application declined — DTI ratio exceeded 60%',
    loanId: 'LN-2022-009', loanType: 'Business Loan',
    lender: 'San Hec Bro Lending Inc.', applicationDate: 'November 12, 2022',
    creditPointsEarned: 0,
  },
];

// ─── Store state ───────────────────────────────────────────────────────────────
let _activeLoan    = null;
let _loanHistory   = [_SEED_COMPLETED_LOAN, _SEED_FAILED_LOAN];
let _transactions  = [..._SEED_TRANSACTIONS];
let _walletBalance = 15250.75;  // Shared wallet balance across all screens
let _walletTxns    = [          // Wallet-level transactions (transfers, cash-ins, QR)
  { id: 'W-001', type: 'Transfer Out', amount: 2500,  to: 'Juan Dela Cruz', bank: 'GCash',     date: new Date().toISOString(),                    status: 'Completed', note: 'Services' },
  { id: 'W-002', type: 'Cash In',      amount: 5000,  source: 'GCash',      date: new Date(Date.now() - 86400000).toISOString(),    status: 'Completed' },
  { id: 'W-003', type: 'QR Payment',   amount: 850,   merchant: 'Coffee Shop', date: new Date(Date.now() - 172800000).toISOString(), status: 'Completed' },
];
let _listeners     = [];

const _notify = () => _listeners.forEach(fn => fn());

// ─── Public API ───────────────────────────────────────────────────────────────

export const subscribe   = (fn) => { _listeners.push(fn); };
export const unsubscribe = (fn) => { _listeners = _listeners.filter(l => l !== fn); };

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWalletBalance = () => _walletBalance;

export const addToWallet = (amount) => {
  _walletBalance += amount;
  _notify();
};

export const deductFromWallet = (amount) => {
  _walletBalance = Math.max(0, _walletBalance - amount);
  _notify();
};

export const setWalletBalance = (balance) => {
  _walletBalance = balance;
  _notify();
};

/** Add a wallet-level transaction (transfer, cash-in, QR) */
export const addWalletTransaction = (tx) => {
  _walletTxns = [tx, ..._walletTxns];
  _notify();
};

/** Get wallet-level transactions only */
export const getWalletTransactions = () => [..._walletTxns];

/** Get ALL transactions — wallet + loan store combined, sorted newest first */
export const getAllTransactions = () => {
  const loanTxForWallet = _transactions.map(t => ({
    id:     t.id,
    type:   t.type,
    amount: t.amountNum ?? parseFloat(t.amount) ?? 0,
    date:   t.date,
    status: t.status,
    source: t.lender,
    note:   t.loanType ? `${t.loanType} · ${t.loanId}` : undefined,
    _raw:   t,
  }));
  return [
    ..._walletTxns,
    ...loanTxForWallet,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ── Loan ──────────────────────────────────────────────────────────────────────
export const getActiveLoan = () => _activeLoan;

export const setActiveLoan = (loan) => {
  if (!loan) {
    _activeLoan = null;
  } else if (loan.status === 'Completed' || loan.status === 'Failed') {
    _activeLoan = null;
    if (!_loanHistory.find(l => l.id === loan.id)) {
      _loanHistory = [loan, ..._loanHistory];
    } else {
      _loanHistory = _loanHistory.map(l => l.id === loan.id ? loan : l);
    }
  } else {
    _activeLoan = loan;
  }
  _notify();
};

/**
 * Commit a new loan application.
 * Creates the Active loan record, a disbursement transaction, and
 * CREDITS the net release amount to the wallet — all atomically.
 */
export const commitLoanApplication = (submittedApp) => {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-PH');
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  // Coerce every numeric field — prevents NaN crashing .toLocaleString()
  const amount        = Number(submittedApp.amount)         || 0;
  const processingFee = Number(submittedApp.processingFee)  || 0;
  const netRelease    = Number(submittedApp.netRelease      ?? (amount - processingFee)) || 0;
  const totalInterest = Number(submittedApp.totalInterest)  || 0;
  const totalPayable  = Number(submittedApp.totalPayment    ?? (amount + totalInterest)) || 0;
  const monthlyPay    = Number(submittedApp.monthlyPayment) || 0;
  const annualRate    = (Number(submittedApp.interestRate)  || 0) * 12;

  const dueDate = _addMonths(now, 1);

  const loan = {
    id:                submittedApp.id,
    type:              submittedApp.type,
    lender:            submittedApp.lender,
    lenderId:          submittedApp.lenderId,
    status:            'Active',
    applicationDate:   dateStr,
    amount,
    netRelease,
    processingFee,
    interestRate:      annualRate,
    interestType:      submittedApp.interestType,
    totalInterest,
    totalPayable,
    monthlyPayment:    monthlyPay,
    term:              submittedApp.terms,
    remainingBalance:  amount,
    paidAmount:        0,
    paymentsCompleted: 0,
    paymentsRemaining: submittedApp.terms,
    loanStartDate:     dateStr,
    loanEndDate:       _addMonths(now, submittedApp.terms).toLocaleDateString('en-PH'),
    dueDate:           dueDate.toLocaleDateString('en-PH'),
    nextDueDate:       dueDate.toLocaleDateString('en-PH'),
    _nextDueISO:       dueDate.toISOString(),
    monthlyIncome:     `${fmtCurrency(Number(submittedApp.monthlyIncome) || 0)} / month`,
    collateral:        submittedApp.collateral || 'None',
    purpose:           submittedApp.purpose,
    officerName:       'Maria Santos',
    officerContact:    '+63 917 000 0000',
    branchName:        'Lora Finance – Main Branch',
    branchAddress:     'Ground Floor, Finance Tower, Cebu City',
    creditScore:       submittedApp.creditScore,
    creditTier:        submittedApp.creditTier,
  };

  _activeLoan = loan;

  // ── Credit wallet with net release ──
  _walletBalance += netRelease;

  const ts = Date.now();
  const disbTx = {
    id:                 `TX-DISB-${ts}`,
    transactionId:      `TX-DISB-${ts}`,
    type:               'Loan Disbursement',
    status:             'Completed',
    amount:             netRelease.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
    amountNum:          netRelease,
    date:               dateStr,
    time:               timeStr,
    paymentMethod:      'Direct Disbursement',
    loanId:             loan.id,
    loanType:           loan.type,
    lender:             loan.lender,
    applicationDate:    dateStr,
    loanAmount:         amount,
    term:               `${submittedApp.terms} months`,
    interestRate:       annualRate,
    interestType:       submittedApp.interestType,
    totalInterest,
    processingFee,
    netRelease,
    creditPointsEarned: 5,
  };

  _transactions = [disbTx, ..._transactions];

  // Also add a wallet transaction record
  _walletTxns = [{
    id:     `W-DISB-${ts}`,
    type:   'Loan Disbursement',
    amount: netRelease,
    source: loan.lender,
    date:   now.toISOString(),
    status: 'Completed',
    note:   `${loan.type} · ${loan.id}`,
  }, ..._walletTxns];

  _notify();
  return loan;
};

/**
 * Record a loan payment.
 * Deducts payment amount from wallet balance and updates loan state.
 */
export const recordPayment = ({ amount, method, principal, interest }) => {
  if (!_activeLoan) return null;

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-PH');
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const ts      = Date.now();

  const newPaid      = _activeLoan.paidAmount + amount;
  const newBalance   = Math.max(0, _activeLoan.remainingBalance - (principal ?? amount));
  const newCompleted = _activeLoan.paymentsCompleted + 1;
  const newRemaining = _activeLoan.paymentsRemaining - 1;
  const isFullyPaid  = newRemaining <= 0;

  // Deduct from wallet
  _walletBalance = Math.max(0, _walletBalance - amount);

  const tx = {
    id:                 `TX-PAY-${ts}`,
    transactionId:      `TX-PAY-${ts}`,
    type:               'Payment',
    status:             'Completed',
    amount:             amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
    amountNum:          amount,
    principal:          principal ?? amount,
    interest:           interest  ?? 0,
    date:               dateStr,
    time:               timeStr,
    paymentMethod:      method || 'Cash',
    loanId:             _activeLoan.id,
    loanType:           _activeLoan.type,
    lender:             _activeLoan.lender,
    applicationDate:    _activeLoan.applicationDate,
    creditPointsEarned: 20,
  };

  _transactions = [tx, ..._transactions];

  // Wallet transaction record
  _walletTxns = [{
    id:     `W-PAY-${ts}`,
    type:   'Payment',
    amount: amount,
    to:     _activeLoan.lender,
    date:   now.toISOString(),
    status: 'Completed',
    note:   `Loan payment · ${_activeLoan.id}`,
  }, ..._walletTxns];

  const currentDueISO = _activeLoan._nextDueISO || new Date(_activeLoan.nextDueDate).toISOString();
  const nextDue       = _addMonths(new Date(currentDueISO), 1);

  const updatedLoan = {
    ..._activeLoan,
    paidAmount:        newPaid,
    remainingBalance:  newBalance,
    paymentsCompleted: newCompleted,
    paymentsRemaining: newRemaining,
    status:            isFullyPaid ? 'Completed' : 'Active',
    dueDate:           isFullyPaid ? _activeLoan.dueDate    : nextDue.toLocaleDateString('en-PH'),
    nextDueDate:       isFullyPaid ? _activeLoan.nextDueDate: nextDue.toLocaleDateString('en-PH'),
    _nextDueISO:       isFullyPaid ? currentDueISO          : nextDue.toISOString(),
  };

  if (isFullyPaid) {
    _activeLoan  = null;
    _loanHistory = [updatedLoan, ..._loanHistory];
  } else {
    _activeLoan = updatedLoan;
  }

  _notify();
  return tx;
};

export const markLoanFailed = (reason = 'Application rejected') => {
  if (!_activeLoan) return;
  const now    = new Date();
  const ts     = Date.now();
  const failed = {
    ..._activeLoan,
    status:        'Failed',
    failureReason: reason,
    failureDate:   now.toLocaleDateString('en-PH'),
  };
  _activeLoan  = null;
  _loanHistory = [failed, ..._loanHistory];

  const safeAmount = (failed.netRelease ?? 0);
  const failTx = {
    id:                 `TX-FAIL-${ts}`,
    transactionId:      `TX-FAIL-${ts}`,
    type:               'Loan Disbursement',
    status:             'Failed',
    amount:             safeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
    amountNum:          safeAmount,
    date:               now.toLocaleDateString('en-PH'),
    time:               now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    paymentMethod:      'N/A',
    failureReason:      reason,
    loanId:             failed.id,
    loanType:           failed.type,
    lender:             failed.lender,
    applicationDate:    failed.applicationDate,
    creditPointsEarned: 0,
  };
  _transactions = [failTx, ..._transactions];
  _notify();
};

export const getTransactions = (loanId) =>
  loanId ? _transactions.filter(t => t.loanId === loanId) : [..._transactions];

/** Only failed + completed loans */
export const getLoanHistory = () =>
  _loanHistory.filter(l => l.status === 'Completed' || l.status === 'Failed');

/** Only FAILED loans */
export const getFailedLoans = () =>
  _loanHistory.filter(l => l.status === 'Failed');

/** Active + all history */
export const getAllLoans = () => [
  ...(_activeLoan ? [_activeLoan] : []),
  ..._loanHistory,
];

export const clearActiveLoan = () => {
  _activeLoan = null;
  _notify();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const LoanStore = {
  // Wallet
  getWalletBalance,
  addToWallet,
  deductFromWallet,
  setWalletBalance,
  addWalletTransaction,
  getWalletTransactions,
  getAllTransactions,
  // Loans
  getActiveLoan,
  setActiveLoan,
  commitLoanApplication,
  recordPayment,
  markLoanFailed,
  getTransactions,
  getLoanHistory,
  getFailedLoans,
  getAllLoans,
  clearActiveLoan,
  // Pub/sub
  subscribe,
  unsubscribe,
  // Helpers
  getCreditTier,
  CREDIT_TIERS,
  fmtCurrency,
};

export default LoanStore;