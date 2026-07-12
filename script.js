// 전역 변수 캐싱
let audioCoin, audioBgm, introCinematic;
let galleryMainImg;

document.addEventListener("DOMContentLoaded", () => {
  // DOM 캐싱
  audioCoin = document.getElementById('audioCoin');
  audioBgm = document.getElementById('audioBgm');
  introCinematic = document.getElementById('introCinematic');
  galleryMainImg = document.getElementById('galleryMainView');

  // 1. 인트로 세션 제어
  const hasEntered = sessionStorage.getItem('mario-intro-passed');
  if (hasEntered === 'true') {
    if (introCinematic) introCinematic.remove();
  } else {
    // History API: 초기 상태 push
    history.replaceState({ page: 'main' }, '', '#main');
    
    // ? 박스 클릭 이벤트
    const qBox = document.getElementById('questionBox');
    if (qBox) {
      qBox.addEventListener('click', enterDashboard);
    }
  }

  // 2. 계좌 복사 이벤트 (이벤트 위임 활용)
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', function() {
      const accountInfo = this.getAttribute('data-account');
      navigator.clipboard.writeText(accountInfo).then(() => {
        const originalText = this.innerText;
        this.innerText = '완료!';
        this.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
          this.innerText = originalText;
          this.style.backgroundColor = '#333';
        }, 1500);
      });
    });
  });

  // D-Day 계산기 실행
  calculateDDay();

  // 3. History API 기반 모달 뒤로가기 제어
  window.addEventListener('popstate', (e) => {
    // 모든 모달을 닫는 로직 실행
    document.querySelectorAll('.full-screen-modal.open').forEach(modal => {
      closeModalUI(modal.id.replace('modal-', ''));
    });
  });
});

// D-Day 계산 함수 분리 및 정밀 매칭
function calculateDDay() {
  const weddingDate = new Date('2026-09-19');
  const today = new Date();
  
  weddingDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  const diffTime = weddingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const dDayBadge = document.getElementById('dDayBadge');
  if (dDayBadge) {
    if (diffDays > 0) {
      dDayBadge.innerText = `D - ${diffDays}`;
    } else if (diffDays === 0) {
      dDayBadge.innerText = `D - Day`;
    } else {
      dDayBadge.innerText = `D + ${Math.abs(diffDays)}`;
    }
  }
}

// ==========================================
// 인트로 인터랙션
// ==========================================
function enterDashboard() {
  if (audioCoin) {
    audioCoin.currentTime = 0;
    audioCoin.play().catch(e => console.log('Audio error:', e));
  }

  if (introCinematic) {
    introCinematic.classList.add('fade-out');
    setTimeout(() => {
      introCinematic.remove();
      if (audioBgm) {
        audioBgm.play().catch(e => console.log('BGM 자동재생 차단됨', e));
      }
    }, 500);
  }
  sessionStorage.setItem('mario-intro-passed', 'true');
}

// ==========================================
// 모달 (SPA 스테이지) 제어 로직
// ==========================================
function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';
    
    modal.offsetHeight; 
    modal.classList.add('open');

    history.pushState({ modal: type }, '', `#${type}`);
  }
}

function closeModal(type) {
  if (location.hash === `#${type}`) {
    history.back();
  } else {
    closeModalUI(type);
  }
}

function closeModalUI(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.style.display = 'none';
      if (document.querySelectorAll('.full-screen-modal.open').length === 0) {
        document.body.classList.remove('modal-open');
      }
    }, 300);
  }
}

// ==========================================
// 갤러리 로직
// ==========================================
function changeGalleryMain(src, element) {
  if (!galleryMainImg) return;
  
  galleryMainImg.style.opacity = '0.5';
  setTimeout(() => {
    galleryMainImg.src = src;
    galleryMainImg.style.opacity = '1';
  }, 150);

  document.querySelectorAll('.gallery-thumbnail').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// ==========================================
// Firebase 방명록 로직
// ==========================================
const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX",
  databaseURL: "XXX",
  projectId: "XXX",
  storageBucket: "XXX",
  messagingSenderId: "XXX",
  appId: "XXX"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function submitGuestMessage() {
  const nameInput = document.getElementById('guestName');
  const msgInput = document.getElementById('guestMsg');

  if (!nameInput || !msgInput) return;
  const name = nameInput.value.trim();
  const msg = msgInput.value.trim();

  if (!name || !msg) {
    alert('이름과 축하 메시지를 모두 입력해 주세요.');
    return;
  }

  const isConfirm = window.confirm('메시지를 남기시겠습니까? 띵~🪙');
  if (isConfirm) {
    if (audioCoin) {
      audioCoin.currentTime = 0;
      audioCoin.play().catch(()=>{});
    }

    const guestbookRef = database.ref('mario_guestbook');
    guestbookRef.push({
      name: name,
      msg: msg,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      nameInput.value = '';
      msgInput.value = '';
    }).catch((error) => alert('저장 실패: ' + error.message));
  }
}

database.ref('mario_guestbook').orderByChild('timestamp').on('value', function(snapshot) {
  const listContainer = document.getElementById('guestbookList');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  const cardsArray = [];

  snapshot.forEach(function(childSnapshot) {
    const data = childSnapshot.val();
    
    const newCard = document.createElement('div');
    newCard.className = 'guest-card';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'guest-card-name';
    nameDiv.textContent = data.name;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'guest-card-msg';
    msgDiv.textContent = data.msg;

    newCard.appendChild(nameDiv);
    newCard.appendChild(msgDiv);
    cardsArray.unshift(newCard);
  });

  cardsArray.forEach(card => listContainer.appendChild(card));
});