/*
 * 초기 설정 데이터 (기획서 v0.4 기준).
 * 가격·문구·프로 정보는 모두 여기서 시작하고, 이후에는 관리자 페이지에서 수정한 값이 기기에 저장된다.
 */
(function (root) {
  'use strict';

  function defaults() {
    var pricing = root.SBPricing.defaultPricing();
    return {
      schema: 2,
      items: pricing.items,
      validity: pricing.validity,
      couponMonths: pricing.couponMonths,

      // 할인 적용 버튼: 기본값 꺼짐. 기간을 정하면 끝날 때 자동으로 꺼진다.
      discount: { on: false, start: '', end: '' },

      // 기간 한정 홍보 문구: 기본값 모두 꺼짐.
      promos: [
        { id: 'thanks', text: '분기 회원감사 이벤트', on: false, start: '', end: '' },
        { id: 'sale', text: '파격 할인 이벤트', on: false, start: '', end: '' },
        { id: 'cafe', text: '회원님을 위한 카페의 여유와 품격', on: false, start: '', end: '' }
      ],

      texts: {
        brand: 'THE SWING BLACK',
        branch: '검단점',
        slogan1: '대한민국 최고 럭셔리 골프 연습장',
        slogan2: '최고의 환경에서 최고의 스윙을 경험하세요',
        builderTagline: '패키지 상품을 회원님이 직접 조합하는 맞춤형 상품',
        pledge: '전국 1등 매장이 될 수 있도록 항상 고민하고 노력하겠습니다',
        promises: [
          '일반 연습장보다 1.5배 이상 넓은 검단 유일의 1인 타석',
          '레슨권 매출 100%를 레슨 프로에게 배당, 일반 매장보다 경쟁력 있는 가격',
          '패키지 상품을 회원이 직접 조합하는 맞춤형 상품',
          '기본 1일 1회 60분, 빈 타석이 2개 이상이면 연장 이용 가능',
          '매일 미화 작업으로 쾌적한 환경',
          '10년을 내다보며 최고의 아카데미를 만드는 노력',
          '매니저 프로님들의 최상의 서비스'
        ],
        trust: [
          { big: '1,300명', label: '누적 회원 돌파', on: true },
          { big: '3년 연속 1위', label: '검단 신도시 레슨 만족도', on: true },
          { big: '부문 1위', label: '골프 연습장 부문', on: true },
          { big: '부문 1위', label: '레슨 만족도 부문', on: true }
        ],
        terms: ''
      },

      facility: [
        { id: 'open24', icon: 'clock24', asset: '', title: '24시간 운영', desc: '오픈 시간에 사람이 몰리는 일이 없습니다. 새벽 출근 전, 퇴근 후 심야, 교대 근무까지 내 일정에 맞춰 이용하세요.', on: true },
        { id: 'bays', icon: 'bays', asset: 'facility-bays-all', title: '총 18개 타석', desc: '넉넉한 타석으로 기다림 없이 여유롭게 연습할 수 있습니다.', on: true },
        { id: 'private', icon: 'bay', asset: 'facility-bay-1', title: '1.5배 넓은 1인 타석', desc: '일반 연습장보다 1.5배 이상 넓은 검단 유일의 1인 타석에서 프라이빗하게 연습합니다.', on: true },
        { id: 'gc3', icon: 'gc3', asset: 'facility-gc3', title: 'GC3 장비', desc: '실제 선수들이 사용하는 정확도 높은 측정 장비를 모든 타석에서 사용합니다.', on: true },
        { id: 'partition', icon: 'partition', asset: 'facility-partition', title: '타석마다 칸막이', desc: '모든 타석에 칸막이가 설치되어 타구 사고 걱정이 없습니다.', on: true },
        { id: 'putting', icon: 'putting', asset: 'facility-putting-indoor', title: '실내 퍼팅장', desc: '실전처럼 퍼팅을 연습할 수 있습니다.', on: true },
        { id: 'long', icon: 'bunker', asset: 'facility-putting-long', title: '20M 롱퍼팅장 · 30M 타겟 벙커장', desc: '롱퍼팅과 벙커샷까지 한곳에서 연습합니다.', on: true },
        { id: 'fitting', icon: 'fitting', asset: 'facility-fitting-room', title: '피팅룸', desc: '편하게 옷을 갈아입을 수 있는 피팅룸이 있습니다.', on: true },
        { id: 'parking', icon: 'parking', asset: 'facility-parking', title: '주차 2시간 무료', desc: '연습하는 동안 주차 걱정 없이 이용하세요.', on: true },
        { id: 'clean', icon: 'clean', asset: 'facility-cleaning', title: '매일 미화 작업', desc: '매일 미화 작업으로 쾌적한 환경을 유지합니다.', on: true },
        { id: 'cafe', icon: 'cafe', asset: 'facility-cafe', title: '카페', desc: '회원님을 위한 카페의 여유와 품격.', on: false }
      ],

      guide: [
        { title: '운영 시간', body: '24시간 운영합니다. 원하시는 시간에 방문해 주세요.' },
        { title: '이용 시간', body: '1일 1회 60분 이용이 기본입니다. 빈 타석이 2개 이상이면 연장해서 이용할 수 있습니다.' },
        { title: '시간대 구분', body: '1부 00:00~12:00 · 2부 00:00~17:00 · 3부 종일(24시간)' },
        { title: '휴회', body: '1개월권은 휴회할 수 없습니다. 3개월권 7일, 6개월권 14일까지 가능하며, 병가는 최대 2주입니다.' },
        { title: '시설 점검 휴장', body: '3개월마다 1회 시설 점검으로 휴장하며, 3주 전에 미리 공지합니다.' },
        { title: '레슨', body: '소속 프로 외 레슨은 금지됩니다. 레슨 예약 취소는 24시간 전까지 가능합니다.' },
        { title: '주차', body: '2시간 무료로 이용할 수 있습니다.' }
      ],

      lessonInfo: {
        m15: '핵심만 짚는 집중 레슨입니다. 시간이 부족하면 2회를 이어서 사용할 수도 있습니다.',
        m25: '여유 있게 배우고 싶은 분께 추천합니다. 스윙을 차근차근 교정합니다.',
        payout: '레슨권 매출은 100% 레슨 프로에게 배당됩니다. 그래서 일반 매장보다 경쟁력 있는 가격으로 드립니다.'
      },

      // 요일: 0=일 1=월 2=화 3=수 4=목 5=금 6=토
      pros: [
        {
          id: 'song-wonmin', name: '송원민', badge: 'KPGA', asset: 'pros-song-wonmin',
          start: '07:00', end: '17:00', off: [3, 6],
          awards: [
            '서울특별시 협회장배 우승',
            '13회 US펜시 토너먼트 챔피언십 5위',
            '파주시 골프협회장배 준우승',
            '태국 CHANG 주니어 대회 준우승',
            '경기도 골프협회 경인일보배 개인전 3위'
          ],
          career: [
            'US펜시 토너먼트 챔피언십 투어활동',
            'KPGA 프로 입단',
            '일산 킨텍스 THE GOLF SHOW',
            '골프 박람회 초청 레슨',
            '일산 마두점 GDR골프존 아카데미',
            '인천 청라60 GDR골프존 아카데미',
            '현) 더 스윙 블랙 검단 골프아카데미 소속프로'
          ]
        },
        {
          // 2026-11-10 최승우 프로에서 교체. 근무 시간과 휴무는 받은 자료에 없어 앞 프로의 값을 그대로 두었다(관리자 페이지에서 수정).
          id: 'son-jimin', name: '손지민', badge: 'KPGA', asset: 'pros-son-jimin',
          start: '14:00', end: '23:00', off: [5, 6],
          awards: [
            '태국 주니어투어 우승 1회'
          ],
          career: [
            'KPGA 프로 입회',
            'KPGA 투어프로 입회',
            '스릭슨 투어 활동 (2부, 3부 투어)',
            '전)GDR청주오송점 소속프로',
            '전)이룸골프 일산센터 소속프로',
            '전)아하골프스튜디오 소속프로 및 중,고 주니어 선수반 티칭',
            '전)더 골드 클래스 일산점 개인레슨',
            '현)스윙블랙 골프아카데미 소속프로',
            '한국골프대학교 졸업',
            '윤석진 프로 TRACKMAN MASTER 인증수료',
            'VICTER KIM GOLF& DRILL 인증수료',
            'Rotex motion 교습가 교육 이수'
          ]
        }
      ],

      // 인트로 대본. say는 음성 합성용 발음 표기(없으면 text를 읽는다).
      intro: [
        { id: 'intro1', scene: 'logo', text: '안녕하세요. 스윙블랙 검단점입니다.' },
        { id: 'intro2', scene: 'bays', text: '저희 센터는 총 18개의 타석이 있으며, 타석이 넓고 프라이빗하게 연습하실 수 있다는 것이 가장 큰 장점입니다.' },
        { id: 'intro3', scene: 'clock', text: '저희는 24시간 운영합니다. 다른 연습장처럼 오픈 시간에 사람이 몰리는 일이 없어서, 원하시는 시간에 여유롭게 연습하실 수 있습니다.' },
        { id: 'intro4', scene: 'gc3', text: '기계는 GC3를 사용합니다. 정확도가 매우 높아 실제 선수들이 사용하는 장비입니다.', say: '기계는 지씨 쓰리를 사용합니다. 정확도가 매우 높아 실제 선수들이 사용하는 장비입니다.' },
        { id: 'intro5', scene: 'partition', text: '타석마다 칸막이가 모두 설치되어 있어 타구 사고 걱정이 없습니다.' },
        { id: 'intro6', scene: 'putting', text: '실내 퍼팅장도 있어서 실전처럼 연습하시고, 레슨도 받으실 수 있습니다.' },
        { id: 'intro7', scene: 'amenity', text: '편하게 옷을 갈아입으실 수 있는 피팅룸이 있고, 주차는 2시간 무료로 이용하실 수 있습니다.' },
        { id: 'intro8', scene: 'slots', text: '이용권은 이용 시간대에 따라 1부, 2부, 3부로 나뉩니다. 1부는 자정부터 낮 12시까지, 2부는 자정부터 오후 5시까지, 3부는 종일 이용하실 수 있습니다.' },
        { id: 'intro9', scene: 'start', text: '궁금하신 점은 편하게 질문해 주세요. 지금부터 가격을 함께 살펴보겠습니다.' }
      ],

      ments: {
        builder: '원하시는 시간대부터 골라 주세요. 천천히 하나씩 선택하시면 됩니다.',
        slot1: '저희는 24시간 운영이라 원하시는 시간에 오실 수 있습니다. 1부는 자정부터 낮 12시까지 이용하실 수 있습니다.',
        slot2: '저희는 24시간 운영이라 원하시는 시간에 오실 수 있습니다. 2부는 자정부터 오후 5시까지 이용하실 수 있습니다.',
        slot3: '저희는 24시간 운영이라 원하시는 시간에 오실 수 있습니다. 3부는 하루 종일 언제든 이용하실 수 있습니다.',
        lesson: '3개월 이상 가입하시면 레슨을 패키지 가격으로 이용하실 수 있습니다. 레슨은 프로님 근무 시간에 예약하실 수 있습니다.',
        facility: '더스윙블랙은 일곱 가지를 약속드립니다. 넓은 1인 타석부터 최상의 서비스까지, 천천히 살펴보세요.',
        pros: '저희 센터에는 KPGA 프로 두 분이 소속되어 있습니다. 근무 시간과 휴무일을 확인하고 레슨을 예약해 주세요.',
        guide: '이용 안내입니다. 24시간 운영하며, 하루 한 번 60분 이용이 기본입니다.'
      },

      settings: {
        pinHash: '',
        voiceOn: true,
        sfxOn: true,
        voiceRate: 0.92,
        idleSec: 90
      }
    };
  }

  root.SBDefaults = defaults;
})(typeof self !== 'undefined' ? self : this);
