import React from "react";


const UserNickname: React.FC = () => {
   
   
   
    
   
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed p-4"
        style={{
          backgroundImage: 'url("/images/splash_background.jpg")'
        }}
      >
        {/* 배경 오버레이 */}
        <div className="fixed inset-0 bg-black bg-opacity-70"></div>
   
        {/* 메인 컨텐츠 */}
        <div className="relative z-10">
          {/* 제목 */}
          <div className="text-center mb-8">
            <h1 
              className="text-4xl font-bold text-red-500 mb-2"
              style={{ fontFamily: 'BMEuljiro10yearslater' }}
            >
              생존자 대피소
            </h1>
            <p className="text-gray-400">안전한 방을 찾거나 새로운 대피소를 만드세요</p>
          </div>
   
         
            <button 
              className="px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors duration-200 font-medium"
              onClick={() => setShowCreateModal(true)}
            >
              대피소 생성
            </button>
          </div>
   
          
   
          {/* 방 생성 모달 */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 p-8 rounded-lg w-full max-w-lg border border-gray-800">
                <h2 
                  className="text-2xl font-bold text-red-500 mb-6 text-center"
                  style={{ fontFamily: 'BMEuljiro10yearslater' }}
                >
                  새로운 대피소 생성
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">대피소 이름</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    />
                  </div>
   
                  
                  <div>
                    <label className="block text-gray-300 mb-2">보안 코드</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                      value={newRoom.password}
                      onChange={(e) => setNewRoom({...newRoom, password: e.target.value})}
                    />
                  </div>
   
                  <div>
                    <label className="block text-gray-300 mb-2">생존자 역할 분배</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <input
                          type="number"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                          value={newRoom.mafia}
                          onChange={(e) => setNewRoom({...newRoom, mafia: parseInt(e.target.value)})}
                        />
                        <span className="text-sm text-gray-400 mt-1 block">감염자</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                          value={newRoom.police}
                          onChange={(e) => setNewRoom({...newRoom, police: parseInt(e.target.value)})}
                        />
                        <span className="text-sm text-gray-400 mt-1 block">보안요원</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                          value={newRoom.doctor}
                          onChange={(e) => setNewRoom({...newRoom, doctor: parseInt(e.target.value)})}
                        />
                        <span className="text-sm text-gray-400 mt-1 block">의무관</span>
                      </div>
                    </div>
                  </div>
   
                  <div>
                    <label className="block text-gray-300 mb-2">생존 시간 설정</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <input
                          type="number"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                          value={newRoom.dayTime}
                          onChange={(e) => setNewRoom({...newRoom, dayTime: parseInt(e.target.value)})}
                        />
                        <span className="text-sm text-gray-400 mt-1 block">주간</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                          value={newRoom.nightTime}
                          onChange={(e) => setNewRoom({...newRoom, nightTime: parseInt(e.target.value)})}
                        />
                        <span className="text-sm text-gray-400 mt-1 block">야간</span>
                      </div>
                      <div>
                        <input
                          type="number"
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-100"
                          value={newRoom.voteTime}
                          onChange={(e) => setNewRoom({...newRoom, voteTime: parseInt(e.target.value)})}
                        />
                        <span className="text-sm text-gray-400 mt-1 block">투표</span>
                      </div>
                    </div>
                  </div>
   
                  <div className="flex justify-end gap-2 pt-6">
                    <button
                      className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewRoom({
                          name: '',
                          maxPlayers: 8,
                          password: '',
                          mafia: 2,
                          police: 1,
                          doctor: 1,
                          dayTime: 180,
                          nightTime: 180,
                          voteTime: 60
                        });
                      }}
                    >
                      취소
                    </button>
                    <button
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                      onClick={handleCreateRoom}
                    >
                      생성
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
   };

export default UserNickname;