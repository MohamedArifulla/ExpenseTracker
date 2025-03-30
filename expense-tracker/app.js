import {
  auth, db, messaging, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, query, where, collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getToken,
  onMessage,
  getDoc
} from './firebase-init.js';

// Auth Functions
window.signUp = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showApp();
  } catch (err) {
    alert(err.message);
  }
};

window.login = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showApp();
  } catch (err) {
    alert(err.message);
  }
};

window.googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    showApp();
  } catch (err) {
    alert(err.message);
  }
};

// Expense CRUD
window.addExpense = async () => {
  const expense = {
    userId: auth.currentUser.uid,
    amount: parseFloat(document.getElementById('amount').value),
    category: document.getElementById('category').value,
    date: document.getElementById('date').value,
  };

  try {
    await addDoc(collection(db, 'expenses'), expense);
    document.getElementById('amount').value = '';
  } catch (err) {
    alert(err.message);
  }
};

window.deleteExpense = async (expenseId) => {
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (err) {
    alert(err.message);
  }
};

// Budget Tracking
window.setBudget = async () => {
  const budget = parseFloat(document.getElementById('budget').value);
  try {
    await setDoc(doc(db, 'budgets', auth.currentUser.uid), { amount: budget });
  } catch (err) {
    alert(err.message);
  }
};

// Real-Time Updates & Charts
let monthlyChart, categoryChart;

function showApp() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Load Expenses
  const expensesQuery = query(collection(db, 'expenses'),
    where('userId', '==', auth.currentUser.uid));

  onSnapshot(expensesQuery, (snapshot) => {
    const expenses = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    // Update Expenses List
    const list = document.getElementById('expensesList');
    list.innerHTML = expenses.map(expense => `
      <div>
        ₹${expense.amount} - ${expense.category} (${expense.date})
        <button onclick="deleteExpense('${expense.id}')">Delete</button>
      </div>
    `).join('');

    // Update Charts
    updateCharts(expenses);
    // Budget Notifications
    const budgetRef = doc(db, 'budgets', auth.currentUser.uid);
    getDoc(budgetRef).then((docSnap) => {
      const budget = docSnap.exists() ? docSnap.data().amount : 0;
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      if (budget > 0 && total >= budget * 0.8) {
        showNotification('Budget Alert: You’ve used 80% of your budget!');
      }
    });
  });


  // Setup FCM Notifications
  setupNotifications();
  checkRecurringExpenses();
}

// Charts
function updateCharts(expenses) {
  // Monthly Chart
  const monthlyData = expenses.reduce((acc, expense) => {
    const month = expense.date.split('-')[1]; // "2023-09-15" → "09"
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {});

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'line',
    data: {
      labels: Object.keys(monthlyData),
      datasets: [{
        label: 'Monthly Spending',
        data: Object.values(monthlyData),
        borderColor: '#2196F3'
      }]
    }
  });

  // Category Chart
  const categoryData = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'pie',
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        data: Object.values(categoryData),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }]
    }
  });
}

// Notifications
async function setupNotifications() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BKk3YUYvPCGSZ_UsdmzXHtrmZgxIvy5UE5LOmDw7BQw7iwmtmM5yZKuU4BdTymgKeJTl4slF2OPdnz73ccxDyCw'
      });
      console.log('FCM Token:', token);

      onMessage(messaging, (payload) => {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/icons/icon-192x192.png'
        });
      });
    } else {
      console.log('Notification permission:', permission);
      // Add UI to explain notifications are blocked
      alert('Please enable notifications in browser settings for budget alerts!');
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
}

function showNotification(message) {
  if (Notification.permission === 'granted') {
    new Notification(message);
  }
}

// Auth State Listener
auth.onAuthStateChanged(user => {
  if (user) showApp();
});

// Check for recurring expenses on app load/login
async function checkRecurringExpenses() {
  const now = new Date();
  const recurringQuery = query(
    collection(db, 'recurring_expenses'),
    where('userId', '==', auth.currentUser.uid),
    where('nextRun', '<=', now)
  );

  const snapshot = await getDoc(recurringQuery);

  snapshot.forEach(async (doc) => {
    const data = doc.data();

    // Add to expenses
    await addDoc(collection(db, 'expenses'), {
      userId: data.userId,
      amount: data.amount,
      category: data.category,
      date: new Date().toISOString(),
      description: data.description + ' (Recurring)'
    });

    // Update next run date
    const nextDate = new Date(data.nextRun);
    nextDate.setMonth(nextDate.getMonth() + data.frequency);

    await updateDoc(doc.ref, {
      nextRun: nextDate.toISOString()
    });
  });
}

// Add recurring expense
window.addRecurring = async () => {

  const getValue = (id) => document.getElementById(id)?.value || '';

  const recurringExpense = {
    userId: auth.currentUser.uid,
    amount: parseFloat(getValue('recurAmount')),
    category: getValue('recurCategory'),
    frequency: parseInt(getValue('recurFrequency')),
    nextRun: new Date().toISOString(),
    description: getValue('recurDescription')
  };

  try {
    await addDoc(collection(db, 'recurring_expenses'), recurringExpense);
    document.getElementById('recurAmount').value = '';
    document.getElementById('recurDescription').value = '';
    alert('Recurring expense added!');
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

// Display recurring expenses
function loadRecurring() {
  const q = query(
    collection(db, 'recurring_expenses'),
    where('userId', '==', auth.currentUser.uid)
  );

  onSnapshot(q, (snapshot) => {
    const list = document.getElementById('recurringList');
    list.innerHTML = snapshot.docs.map(doc => `
      <div>
        ₹${doc.data().amount} - ${doc.data().category} 
        (Every ${doc.data().frequency} months)
        <button onclick="deleteRecurring('${doc.id}')">Delete</button>
      </div>
    `).join('');
  });
}

// Delete recurring
window.deleteRecurring = async (id) => {
  await deleteDoc(doc(db, 'recurring_expenses', id));
};
