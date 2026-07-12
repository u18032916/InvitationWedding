let audioCoin, audioBgm, introCinematic;
let galleryMainImg;

document.addEventListener("DOMContentLoaded", () => {
  audioCoin = document.getElementById('audioCoin');
  audioBgm = document.getElementById('audioBgm');
  introCinematic = document.getElementById('introCinematic');
  galleryMainImg = document.getElementById('galleryMainView');

  const hasEntered = sessionStorage.getItem('mario-intro-passed');
  if (hasEntered === 'true') {
    if (introCinematic) introCinematic.remove();
  } else {
    // History API: 초기 상태 push (에러 방지)
    if(window.history.replaceState) {
      history.replaceState({ page: 'main' }, '', '#main');
    }
    
    const qBox = document.getElementById('questionBox');
    if (qBox) {
      qBox.addEventListener('click', enterDashboard);
    }
  }

  // 🌟 계좌 복사 이벤트 예외 처리 (인앱 브라우저 호환성 강화)
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', function() {
      const accountInfo = this.getAttribute('data-account');
      
      // 클립보드 API가 지원되지 않는 구형 브라우저 대비
      if (navigator.clipboard) {
        navigator.clipboard.writeText(accountInfo).then(() => {
          showCopySuccess(this);
        }).catch(err => {
          alert('복사에 실패했습니다. 직접 복사해주세요: ' + accountInfo);
        });
      } else {
        // Fallback
        alert('계좌번호: ' + accountInfo + '\n(클립보드를 지원하지 않는 브라우저입니다.)');
      }
    });
  });

  function showCopySuccess(button) {
    const originalText = button.innerText;
    button.innerText = '완료!';
    button.style.backgroundColor = '#4CAF50';
    setTimeout(() => {
      button.innerText = originalText;
      button.style.backgroundColor = '#333';
    }, 1500);
  }

  calculateDDay();

  window.addEventListener('popstate', (e) => {
    document.querySelectorAll('.full-screen-modal.open').forEach(modal => {
      closeModalUI(modal.id.replace('modal-', ''));
    });
  });
});

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

// 🌟 Firebase 방명록 로직 (중복 초기화 에러 방어 코드 추가)
const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX",
  databaseURL: "XXX",
  projectId: "XXX",
  storageBucket: "XXX",
  messagingSenderId: "XXX",
  appId: "XXX"
};

// firebase.apps.length가 0일 때만 초기화 (핫리로딩/에러 방지)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
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
    cardsArray.unshift(newCard); // 최신 글이 위로 오도록 배열 앞쪽에 삽입
  });

  cardsArray.forEach(card => listContainer.appendChild(card));
});