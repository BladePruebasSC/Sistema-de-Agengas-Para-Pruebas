import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Award,
  Activity,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppointments } from '../../context/AppointmentContext';
// import { services } from '../../utils/mockData'; // Removed mock data import
import { isSameDate, isDateBefore, isFutureDate } from '../../utils/dateUtils';

interface MonthlyStats {
  month: string;
  appointments: number;
  revenue: number;
}

interface ServiceStats {
  serviceName: string;
  count: number;
  percentage: number;
  revenue: number;
}

interface HourStats {
  hour: string;
  count: number;
  percentage: number;
}

const StatisticsPanel: React.FC = () => {
  const { appointments, barbers, adminSettings, services } = useAppointments(); // Added services from context
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  console.log('[StatisticsPanel] Services from context:', services); // Log services from context
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [hourStats, setHourStats] = useState<HourStats[]>([]);
  const [currentMonthStats, setCurrentMonthStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    averageDaily: 0,
    mostPopularService: '',
    mostPopularHour: '',
    growthRate: 0
  });

  useEffect(() => {
    calculateStatistics();
  }, [appointments, selectedMonth, selectedBarberId]);

  const getFilteredAppointments = () => {
    let filtered = appointments.filter(app => !app.cancelled);
    
    if (selectedBarberId) {
      console.log(`Filtering for barber: ${selectedBarberId}. Appointments before filter:`, filtered.length);
      const barberAppointments = filtered.filter(app => app.barber_id === selectedBarberId);
      console.log(`Appointments after filter for barber ${selectedBarberId}:`, barberAppointments.length, barberAppointments.map(a => ({ id: a.id, barber_id: a.barber_id, date: a.date, service: a.service })));
      filtered = barberAppointments;
    } else {
      console.log("No barber selected, using all non-cancelled appointments:", filtered.length);
    }
    
    return filtered;
  };

  const calculateStatistics = () => {
    const activeAppointments = getFilteredAppointments();
    console.log('[StatisticsPanel] Active appointments for stats:', activeAppointments);

    // Estadísticas de los últimos 6 meses
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(selectedMonth, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthAppointments = activeAppointments.filter(app => {
        const appDate = new Date(app.date);
        return appDate >= start && appDate <= end;
      });
      
      const revenue = monthAppointments.reduce((total, app) => {
        const service = services.find(s => s.id === app.service);
        // console.log(`[Stats - 6m Revenue] App service ID: ${app.service}, Found service: ${JSON.stringify(service)}, Price: ${service?.price}`);
        return total + (service?.price || 0);
      }, 0);

      return {
        month: format(date, 'MMM yyyy', { locale: es }),
        appointments: monthAppointments.length,
        revenue
      };
    }).reverse();

    setMonthlyStats(last6Months);

    // Estadísticas del mes seleccionado
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const currentMonthAppointments = activeAppointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= start && appDate <= end;
    });

    // Estadísticas por servicio
    const serviceCount = new Map<string, number>();
    const serviceRevenue = new Map<string, number>();
    
    currentMonthAppointments.forEach(app => {
      const service = services.find(s => s.id === app.service);
      // console.log(`[Stats - ServiceCount] App service ID: ${app.service}, Found service: ${JSON.stringify(service)}`);
      if (service) {
        serviceCount.set(service.name, (serviceCount.get(service.name) || 0) + 1);
        serviceRevenue.set(service.name, (serviceRevenue.get(service.name) || 0) + service.price);
      }
    });

    const serviceStatsArray: ServiceStats[] = Array.from(serviceCount.entries()).map(([name, count]) => ({
      serviceName: name,
      count,
      percentage: (count / currentMonthAppointments.length) * 100,
      revenue: serviceRevenue.get(name) || 0
    })).sort((a, b) => b.count - a.count);

    setServiceStats(serviceStatsArray);

    // Estadísticas por hora
    const hourCount = new Map<string, number>();
    currentMonthAppointments.forEach(app => {
      hourCount.set(app.time, (hourCount.get(app.time) || 0) + 1);
    });

    const hourStatsArray: HourStats[] = Array.from(hourCount.entries()).map(([hour, count]) => ({
      hour,
      count,
      percentage: (count / currentMonthAppointments.length) * 100
    })).sort((a, b) => b.count - a.count);

    setHourStats(hourStatsArray);

    // Estadísticas generales del mes actual
    const totalRevenue = currentMonthAppointments.reduce((total, app) => {
      const service = services.find(s => s.id === app.service);
      // console.log(`[Stats - MonthRevenue] App service ID: ${app.service}, Found service: ${JSON.stringify(service)}, Price: ${service?.price}`);
      return total + (service?.price || 0);
    }, 0);

    const daysInMonth = end.getDate();
    const averageDaily = currentMonthAppointments.length / daysInMonth;

    // Calcular tasa de crecimiento comparando con el mes anterior
    const previousMonth = subMonths(selectedMonth, 1);
    const prevStart = startOfMonth(previousMonth);
    const prevEnd = endOfMonth(previousMonth);
    const previousMonthAppointments = activeAppointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate >= prevStart && appDate <= prevEnd;
    });

    const growthRate = previousMonthAppointments.length > 0 
      ? ((currentMonthAppointments.length - previousMonthAppointments.length) / previousMonthAppointments.length) * 100
      : 0;

    setCurrentMonthStats({
      totalAppointments: currentMonthAppointments.length,
      totalRevenue,
      averageDaily: Math.round(averageDaily * 10) / 10,
      mostPopularService: serviceStatsArray[0]?.serviceName || 'N/A',
      mostPopularHour: hourStatsArray[0]?.hour || 'N/A',
      growthRate: Math.round(growthRate * 10) / 10
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(addMonths(selectedMonth, 1));
    }
  };

  const getBarberName = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    return barber?.name || 'Barbero desconocido';
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="flex-shrink-0 p-2 lg:p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {React.cloneElement(icon as React.ReactElement, { 
            className: "h-4 w-4 lg:h-6 lg:w-6",
            style: { color }
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl lg:text-2xl font-semibold flex items-center">
          <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-red-600 mr-2" />
          Estadísticas
        </h2>
        
        {/* Controles */}
        <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-4">
          {/* Selector de barbero */}
          {adminSettings.multiple_barbers_enabled && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-600" />
              <select
                value={selectedBarberId || ''}
                onChange={(e) => setSelectedBarberId(e.target.value || null)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Todos los barberos</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Navegador de mes */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
            </button>
            
            <div className="text-center min-w-[120px] lg:min-w-[140px]">
              <h3 className="text-sm lg:text-lg font-semibold text-gray-900">
                {format(selectedMonth, 'MMM yyyy', { locale: es })}
              </h3>
              {selectedBarberId && (
                <p className="text-xs text-gray-600">
                  {getBarberName(selectedBarberId)}
                </p>
              )}
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          title="Citas del Mes"
          value={currentMonthStats.totalAppointments}
          icon={<Calendar />}
          color="#dc2626"
          subtitle={`${currentMonthStats.growthRate >= 0 ? '+' : ''}${currentMonthStats.growthRate}% vs mes anterior`}
        />
        
        <StatCard
          title="Ingresos del Mes"
          value={`$${currentMonthStats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign />}
          color="#059669"
        />
        
        <StatCard
          title="Promedio Diario"
          value={currentMonthStats.averageDaily}
          icon={<Activity />}
          color="#7c3aed"
          subtitle="citas por día"
        />
        
        <StatCard
          title="Servicio Popular"
          value={currentMonthStats.mostPopularService}
          icon={<Award />}
          color="#ea580c"
        />
      </div>

      {/* Gráfico de tendencia mensual */}
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-medium mb-4 flex items-center">
          <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 mr-2" />
          Tendencia de los Últimos 6 Meses
        </h3>
        
        <div className="space-y-3 lg:space-y-4">
          {monthlyStats.map((stat, index) => (
            <div key={stat.month} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                <span className="text-xs lg:text-sm font-medium text-gray-700 w-16 lg:w-20 flex-shrink-0">
                  {stat.month}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 lg:h-3 max-w-32 lg:max-w-48">
                  <div
                    className="bg-blue-600 h-2 lg:h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max((stat.appointments / Math.max(...monthlyStats.map(s => s.appointments))) * 100, 5)}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <span className="text-xs lg:text-sm font-medium text-gray-900 block">
                  {stat.appointments} citas
                </span>
                <p className="text-xs text-gray-500">${stat.revenue.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Estadísticas por servicio */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-medium mb-4 flex items-center">
            <Users className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 mr-2" />
            Servicios Más Solicitados
          </h3>
          
          <div className="space-y-2 lg:space-y-3">
            {serviceStats.slice(0, 5).map((service, index) => (
              <div key={service.serviceName} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  <span className="flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 bg-green-100 text-green-800 text-xs font-medium rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs lg:text-sm font-medium text-gray-700 truncate">
                    {service.serviceName}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs lg:text-sm font-medium text-gray-900 block">
                    {service.count} citas
                  </span>
                  <p className="text-xs text-gray-500">{service.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas por horario */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-medium mb-4 flex items-center">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600 mr-2" />
            Horarios Más Populares
          </h3>
          
          <div className="space-y-2 lg:space-y-3">
            {hourStats.slice(0, 5).map((hour, index) => (
              <div key={hour.hour} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  <span className="flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs lg:text-sm font-medium text-gray-700">
                    {hour.hour}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs lg:text-sm font-medium text-gray-900 block">
                    {hour.count} citas
                  </span>
                  <p className="text-xs text-gray-500">{hour.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de ingresos por servicio */}
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-medium mb-4 flex items-center">
          <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 mr-2" />
          Ingresos por Servicio - {format(selectedMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">
                  Servicio
                </th>
                <th className="text-center py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">
                  Cantidad
                </th>
                <th className="text-center py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">
                  Ingresos
                </th>
                <th className="text-center py-2 px-2 lg:px-4 font-medium text-gray-700 text-xs lg:text-sm">
                  % del Total
                </th>
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((service) => (
                <tr key={service.serviceName} className="border-b border-gray-100">
                  <td className="py-2 px-2 lg:px-4 text-xs lg:text-sm text-gray-900">
                    {service.serviceName}
                  </td>
                  <td className="py-2 px-2 lg:px-4 text-xs lg:text-sm text-gray-900 text-center">
                    {service.count}
                  </td>
                  <td className="py-2 px-2 lg:px-4 text-xs lg:text-sm text-gray-900 text-center">
                    ${service.revenue.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 lg:px-4 text-xs lg:text-sm text-gray-900 text-center">
                    {service.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
        <p className="text-xs lg:text-sm text-blue-800">
          <strong>Nota:</strong> Las estadísticas incluyen solo las citas activas (no canceladas) para un análisis preciso del negocio.
          {selectedBarberId && ` Mostrando datos específicos para ${getBarberName(selectedBarberId)}.`}
        </p>
      </div>
    </div>
  );
};

export default StatisticsPanel;