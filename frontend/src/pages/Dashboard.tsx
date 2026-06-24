function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Top Main Mountain Chart */}
      <div className="lg:col-span-8 bg-[#23272d] rounded-[32px] p-6 shadow-2xl relative h-72 flex flex-col justify-between overflow-hidden group">
        <div className="flex justify-between z-10">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Visão Geral Mensal</p>
              <div className="flex space-x-8 mt-4 text-xs text-gray-500">
                <span>JAN: 12K</span>
                <span>FEV: 15K</span>
                <span>MAR: 8K</span>
                <span>ABR: 22K</span>
              </div>
            </div>
        </div>
        {/* SVG Mountain Graphics (Abstract Representation) */}
        <div className="absolute inset-x-0 bottom-0 top-1/3 opacity-70 flex items-end">
            <svg viewBox="0 0 1000 300" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mount1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818ea1" />
                  <stop offset="100%" stopColor="#1a1e23" />
                </linearGradient>
                <linearGradient id="mount2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffb067" />
                  <stop offset="100%" stopColor="#1a1e23" />
                </linearGradient>
              </defs>
              {/* Background Mountains */}
              <path d="M0,300 L0,200 L150,100 L300,180 L450,80 L650,220 L800,120 L1000,250 L1000,300 Z" fill="url(#mount1)" opacity="0.6"/>
              {/* Foreground Mountain (Orange peak) */}
              <path d="M400,300 L550,150 L650,50 L750,180 L850,220 L1000,200 L1000,300 Z" fill="url(#mount2)" opacity="0.8"/>
              {/* Line graph overlay */}
              <path d="M0,150 Q100,120 200,180 T400,100 T600,60 T800,120 T1000,40" fill="none" stroke="#e0e0e0" strokeWidth="2" strokeDasharray="5,5"/>
            </svg>
        </div>
      </div>

      {/* Right Top Mini Stats */}
      <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#23272d] rounded-[32px] p-6 shadow-xl flex-1 flex flex-col justify-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Taxa de Conversão</p>
            <div className="flex items-end justify-between">
              <h2 className="text-4xl font-light text-white tracking-tighter">0.41%</h2>
              <h2 className="text-3xl font-light text-gray-400">3179</h2>
            </div>
          </div>
          <div className="bg-[#23272d] rounded-[32px] p-6 shadow-xl flex-1 flex flex-col justify-center relative overflow-hidden">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Meta Anual</p>
            <div className="flex items-end justify-between z-10">
              <h2 className="text-4xl font-bold text-white tracking-tighter">80%</h2>
              <h2 className="text-2xl font-light text-gray-400">22%</h2>
            </div>
            {/* Decorative background glow */}
            <div className="absolute right-[-20%] bottom-[-50%] w-48 h-48 bg-[#00e6e6] opacity-10 blur-[50px] rounded-full"></div>
          </div>
      </div>

      {/* Bottom Left - Line Chart Widget */}
      <div className="lg:col-span-4 bg-[#23272d] rounded-[32px] p-6 shadow-xl relative h-64">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Receita / Custos</p>
        <div className="absolute bottom-6 inset-x-6 top-16 flex items-end">
            <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,130 Q50,150 100,110 T200,90 T300,120 T400,60" fill="none" stroke="#ff8c00" strokeWidth="3" />
              <path d="M0,80 Q50,100 100,60 T200,80 T300,30 T400,20" fill="none" stroke="#252f3f" strokeWidth="3" strokeDasharray="4,4"/>
            </svg>
        </div>
      </div>

      {/* Bottom Middle - Circular Chart */}
      <div className="lg:col-span-4 bg-[#23272d] rounded-[32px] p-6 shadow-xl flex flex-col items-center justify-center relative">
          <div className="w-40 h-40 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2a3038" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ff8c00" strokeWidth="3" strokeDasharray="70, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00e6e6" strokeWidth="3" strokeDasharray="10, 100" strokeDashoffset="-70"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-light text-white">71</span>
                <span className="text-[10px] text-gray-500 uppercase mt-1">Pontos</span>
            </div>
          </div>
      </div>

      {/* Bottom Right - Horizontal Bars List */}
      <div className="lg:col-span-4 bg-[#23272d] rounded-[32px] p-6 shadow-xl flex flex-col justify-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">Desempenho da Equipe</p>
          <div className="space-y-4">
            {[
              { name: 'Alice', val: 80, col: 'bg-[#ff8c00]' },
              { name: 'Bob', val: 65, col: 'bg-[#00e6e6]' },
              { name: 'Charlie', val: 40, col: 'bg-gray-600' },
              { name: 'David', val: 90, col: 'bg-[#ffb067]' }
            ].map((item, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 w-12">{item.name}</span>
                  <div className="flex-1 bg-[#1a1e23] h-1.5 rounded-full overflow-hidden">
                      <div className={`${item.col} h-full`} style={{ width: `${item.val}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{item.val}%</span>
                </div>
            ))}
          </div>
      </div>
      
    </div>
  );
}

export default Dashboard;
