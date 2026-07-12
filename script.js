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
    document.getElementById('mainDashboard').classList.add('start-animation');
  } else {
    if (window.history.replaceState) {
      history.replaceState({ page: 'main' }, '', '#main');
    }
    const qBox = document.getElementById('questionBox');
    if (qBox) {
      qBox.addEventListener('click', enterDashboard);
    }
  }

  // 🌟 계좌 복사 이벤트 예외 처리
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', function() {
      const accountInfo = this.getAttribute('data-account');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(accountInfo).then(() => {
          showCopySuccess(this);
        }).catch(err => {
          alert('복사에 실패했습니다. 직접 복사해주세요: ' + accountInfo);
        });
      } else {
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

  // 🌟 [통합] 브라우저 뒤로가기(popstate) 통합 제어 구역
  window.addEventListener('popstate', (e) => {
  // 해시 상태를 체크하여 상세 모달만 먼저 닫힐 수 있도록 처리
  const guestDetailModal = document.getElementById('guestModal');
  
  if (guestDetailModal && guestDetailModal.classList.contains('open') && location.hash !== '#guestbook-detail') {
    closeGuestModalUI();
  } else {
    // 상세 모달이 열려있지 않은 상태에서 뒤로가기가 오면 기본 모달들을 닫음
    document.querySelectorAll('.full-screen-modal.open').forEach(modal => {
      closeModalUI(modal.id.replace('modal-', ''));
    });
  }
  });

  // 물음표 상자 코인 효과 이벤트
  const infoBoxes = document.querySelectorAll('.mario-info-box');
  infoBoxes.forEach(box => {
    box.addEventListener('click', () => {
      if (audioCoin) {
        audioCoin.currentTime = 0;
        audioCoin.play().catch(e => console.log('Audio play blocked:', e));
      }
      const coin = document.createElement('div');
      coin.className = 'box-jump-coin';
      box.appendChild(coin);
      setTimeout(() => { coin.remove(); }, 500);
    });
  });

  // 🌟 [통합] DOM 로드가 끝난 후 Firebase 실시간 리스너를 안전하게 부착
  initFirebaseGuestbook();
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
    if (diffDays > 0) dDayBadge.innerText = `D - ${diffDays}`;
    else if (diffDays === 0) dDayBadge.innerText = `D - Day`;
    else dDayBadge.innerText = `D + ${Math.abs(diffDays)}`;
  }
}

function enterDashboard() {
  if (audioCoin) {
    audioCoin.currentTime = 0;
    audioCoin.play().catch(e => console.log('Audio error:', e));
  }
  if (introCinematic) {
    introCinematic.classList.add('fade-out');
    document.getElementById('mainDashboard').classList.add('start-animation');
    setTimeout(() => {
      introCinematic.remove();
      if (audioBgm) {
        audioBgm.play().catch(e => console.log('BGM 자동재생 차단됨', e));
      }
    }, 500);
  }
  sessionStorage.setItem('mario-intro-passed', 'true');
}

let isMapRendered = false;

function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';
    modal.offsetHeight; 
    modal.classList.add('open');
    history.pushState({ modal: type }, '', `#${type}`);

    if (type === 'map' && !isMapRendered) {
      setTimeout(() => {
        if (typeof daum !== 'undefined' && daum.roughmap && daum.roughmap.Lander) {
          new daum.roughmap.Lander({
            "timestamp" : "1781423724685",
            "key" : "pi429r3ywoe",
            "mapWidth" : "100%",
            "mapHeight" : "100%"
          }).render();
          isMapRendered = true;
        }
      }, 350);
    }
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

function toggleAccountLayer() {
  const layer = document.getElementById('accountLayer');
  const arrow = document.getElementById('slideArrow');
  if (!layer || !arrow) return;
  layer.classList.toggle('active');
  arrow.innerText = layer.classList.contains('active') ? '▼' : '▲';
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

// ========================================================
// 🌟 Firebase 방명록 및 상세 모달 통합 로직
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCYOyUHLIilpamdYoBdf2LI6e2_6hSWk60",
  authDomain: "guestbook-a035c.firebaseapp.com",
  databaseURL: "https://guestbook-a035c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "guestbook-a035c",
  storageBucket: "guestbook-a035c.firebasestorage.app",
  messagingSenderId: "1008314663390",
  appId: "1:1008314663390:web:2285a187e8a990294b9d4f"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 방명록 등록
function submitGuestMessage() {
  if (window.event) window.event.preventDefault();

  const nameInput = document.getElementById('guestName');
  const msgInput = document.getElementById('guestMsg');

  if (!nameInput || !msgInput) return;
  const name = nameInput.value.trim();
  const msg = msgInput.value.trim();

  if (!name || !msg) {
    alert('이름과 축하 메시지를 모두 입력해 주세요.');
    return;
  }

  const isConfirm = window.confirm('작성하신 축하 메시지를 방명록에 남기시겠습니까?');
  if (isConfirm) {
    const targetAudioCoin = document.getElementById('audioCoin');
    if (targetAudioCoin) {
      targetAudioCoin.currentTime = 0;
      targetAudioCoin.play().catch(()=>{});
    }

    // 💡 경로 안정성을 위해 원래 쓰시던 'guestbook'으로 통합 관리합니다.
    const guestbookRef = database.ref('guestbook');
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

// 실시간 감지기 및 화면 출력 초기화 함수
function initFirebaseGuestbook() {
  database.ref('guestbook').orderByChild('timestamp').on('value', function(snapshot) {
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

      const dividerDiv = document.createElement('div');
      dividerDiv.className = 'guest-card-divider';

      const msgDiv = document.createElement('div');
      msgDiv.className = 'guest-card-msg';
      msgDiv.textContent = data.msg;

      newCard.appendChild(nameDiv);
      newCard.appendChild(dividerDiv);
      newCard.appendChild(msgDiv);

      // 카드 클릭 시 상세 팝업 모달 띄우기 (XSS 안전 바인딩)
      newCard.addEventListener('click', function() {
        openGuestModal(data.name, data.msg);
      });

      cardsArray.unshift(newCard); 
    });

    cardsArray.forEach(card => listContainer.appendChild(card));
  });
}

// 🌟 [추가] 방명록 전용 상세 보기 모달 제어 (모달 위의 모달)
function openGuestModal(name, msg) {
  const modal = document.getElementById('guestModal');
  const modalName = document.getElementById('modalGuestName');
  const modalMsg = document.getElementById('modalGuestMsg');

  if (modal && modalName && modalMsg) {
    modalName.innerText = name;
    modalMsg.innerText = msg;
    
    // 묻히지 않도록 강제로 스타일 부여 및 open 클래스 추가
    modal.style.setProperty('display', 'flex', 'important');
    
    history.pushState({ guestModal: true }, '', '#guestbook-detail');
    
    setTimeout(() => { 
      modal.classList.add('open'); 
    }, 30);
  }
}

function closeGuestModal() {
  if (location.hash === '#guestbook-detail') {
    history.back();
  } else {
    closeGuestModalUI();
  }
}

function closeGuestModalUI() {
  const modal = document.getElementById('guestModal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.style.display = 'none';
      const hasOtherFullScreenModal = document.querySelectorAll('.full-screen-modal.open').length > 0;
      if (!hasOtherFullScreenModal) {
        document.body.classList.remove('modal-open');
      }
    }, 300);
  }
}

// 실시간 데이터베이스 연동 및 카드 꽂기
function initFirebaseGuestbook() {
  database.ref('guestbook').orderByChild('timestamp').on('value', function(snapshot) {
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

      const dividerDiv = document.createElement('div');
      dividerDiv.className = 'guest-card-divider';

      const msgDiv = document.createElement('div');
      msgDiv.className = 'guest-card-msg';
      msgDiv.textContent = data.msg;

      newCard.appendChild(nameDiv);
      newCard.appendChild(dividerDiv);
      newCard.appendChild(msgDiv);

      // 카드 터치 시 모달 이벤트 바인딩
      newCard.addEventListener('click', function() {
        openGuestModal(data.name, data.msg);
      });

      // 💡 2줄 바둑판 가로 배열에서 최신순이 앞으로 오게 하려면 정렬을 유지해야 합니다.
      cardsArray.unshift(newCard); 
    });

    cardsArray.forEach(card => listContainer.appendChild(card));
  });
}