// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
// } from 'recharts';
// import { FiDownload, FiUpload } from 'react-icons/fi';
// import * as XLSX from 'xlsx';
// import Papa from 'papaparse';

// interface AnalyticsData {
//   overall: {
//     totalEvaluations: number;
//     averageScore: number;
//     averagePercentage: number;
//   };
//   gradeDistribution: {
//     grade: string;
//     _count: { id: number };
//   }[];
//   monthlyAverages: {
//     month: number;
//     _avg: { percentage: number };
//   }[];
//   departmentAverages: {
//     department_name: string;
//     avg_percentage: number;
//     evaluation_count: number;
//   }[];
//   recentEvaluations: {
//     id: string;
//     employee: {
//       nameEn: string;
//       department: {
//         name: string;
//       };
//     };
//     percentage: number;
//     grade: string;
//     createdAt: string;
//   }[];
// }

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
// const MONTHS = [
//   'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
//   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
// ];

// export default function AnalyticsDashboard() {
//   const [data, setData] = useState<AnalyticsData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAnalytics();
//   }, []);

//   const fetchAnalytics = async () => {
//     try {
//       const response = await fetch('/api/dashboard/analytics');
//       if (!response.ok) throw new Error('Failed to fetch analytics');
//       const analyticsData = await response.json();
//       setData(analyticsData);
//     } catch (error) {
//       console.error('Error fetching analytics:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleExportData = (format: 'xlsx' | 'csv') => {
//     if (!data) return;

//     // Prepare the data
//     const sheets = {
//       'Overall Statistics': [
//         ['Metric', 'Value'],
//         ['Total Evaluations', data.overall.totalEvaluations],
//         ['Average Score', data.overall.averageScore.toFixed(2)],
//         ['Average Percentage', data.overall.averagePercentage.toFixed(2) + '%'],
//       ],
//       'Grade Distribution': [
//         ['Grade', 'Count'],
//         ...data.gradeDistribution.map(g => [
//           g.grade,
//           g._count.id,
//         ]),
//       ],
//       'Monthly Averages': [
//         ['Month', 'Average Percentage'],
//         ...data.monthlyAverages.map(m => [
//           MONTHS[m.month - 1],
//           m._avg.percentage.toFixed(2) + '%',
//         ]),
//       ],
//       'Department Statistics': [
//         ['Department', 'Average Percentage', 'Evaluation Count'],
//         ...data.departmentAverages.map(d => [
//           d.department_name,
//           d.avg_percentage.toFixed(2) + '%',
//           d.evaluation_count,
//         ]),
//       ],
//     };

//     if (format === 'xlsx') {
//       const workbook = XLSX.utils.book_new();
      
//       // Add each sheet to the workbook
//       Object.entries(sheets).forEach(([sheetName, sheetData]) => {
//         const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
//         XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
//       });

//       XLSX.writeFile(workbook, 'evaluation_analytics.xlsx');
//     } else {
//       // For CSV, combine all data into a single file with headers
//       const allData = Object.entries(sheets).flatMap(([sheetName, sheetData]) => {
//         return [
//           [`\n${sheetName}`],
//           ...sheetData,
//         ];
//       });

//       const csv = Papa.unparse(allData);
//       const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//       const link = document.createElement('a');
//       link.href = URL.createObjectURL(blob);
//       link.setAttribute('download', 'evaluation_analytics.csv');
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     try {
//       const fileExtension = file.name.split('.').pop()?.toLowerCase();
//       let jsonData: any[] = [];

//       if (fileExtension === 'csv') {
//         // Handle CSV file
//         const text = await file.text();
//         const result = Papa.parse(text, {
//           header: true,
//           skipEmptyLines: true,
//         });
//         jsonData = result.data;
//       } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
//         // Handle Excel file
//         const data = await file.arrayBuffer();
//         const workbook = XLSX.read(data, { type: 'array' });
//         const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
//         jsonData = XLSX.utils.sheet_to_json(firstSheet);
//       } else {
//         throw new Error('Unsupported file format. Please use CSV or Excel files.');
//       }

//       // Validate the data structure
//       if (!Array.isArray(jsonData) || jsonData.length === 0) {
//         throw new Error('Invalid data format. Please check the file structure.');
//       }

//       // Send data to API
//       const response = await fetch('/api/evaluations/bulk', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(jsonData),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || 'Failed to import data');
//       }

//       const result = await response.json();
//       alert(`Import completed: ${result.message}`);
      
//       // Refresh the analytics data
//       fetchAnalytics();
//     } catch (error) {
//       console.error('Error importing file:', error);
//       alert(error.message || 'Error importing file');
//     }

//     // Clear the file input
//     event.target.value = '';
//   };

//   if (loading) {
//     return <div className="flex justify-center items-center min-h-screen">
//       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
//     </div>;
//   }

//   if (!data) {
//     return <div>Error loading analytics data</div>;
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
//         <div className="flex gap-4">
//           <div className="relative">
//             <button
//               onClick={() => handleExportData('xlsx')}
//               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
//             >
//               <FiDownload className="mr-2" />
//               Export to Excel
//             </button>
//           </div>
//           <div className="relative">
//             <button
//               onClick={() => handleExportData('csv')}
//               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
//             >
//               <FiDownload className="mr-2" />
//               Export to CSV
//             </button>
//           </div>
//           <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 cursor-pointer">
//             <FiUpload className="mr-2" />
//             Import File
//             <input
//               type="file"
//               accept=".xlsx,.xls,.csv"
//               onChange={handleImportFile}
//               className="hidden"
//             />
//           </label>
//         </div>
//       </div>

//       {/* Overall Statistics */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-2">Total Evaluations</h3>
//           <p className="text-3xl font-bold text-indigo-600">{data.overall.totalEvaluations}</p>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-2">Average Score</h3>
//           <p className="text-3xl font-bold text-indigo-600">
//             {data.overall.averageScore?.toFixed(2) || 'N/A'}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-2">Average Percentage</h3>
//           <p className="text-3xl font-bold text-indigo-600">
//             {data.overall.averagePercentage?.toFixed(2)}%
//           </p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         {/* Grade Distribution */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
//           <PieChart width={400} height={300}>
//             <Pie
//               data={data.gradeDistribution}
//               dataKey="_count.id"
//               nameKey="grade"
//               cx="50%"
//               cy="50%"
//               outerRadius={100}
//               label
//             >
//               {data.gradeDistribution.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//         </div>

//         {/* Monthly Trends */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance Trends</h3>
//           <LineChart width={400} height={300} data={data.monthlyAverages}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" tickFormatter={(month) => MONTHS[month - 1]} />
//             <YAxis />
//             <Tooltip 
//               formatter={(value: any) => [`${value.toFixed(2)}%`, 'Average']}
//               labelFormatter={(month) => MONTHS[month - 1]}
//             />
//             <Legend />
//             <Line
//               type="monotone"
//               dataKey="_avg.percentage"
//               stroke="#8884d8"
//               name="Average Percentage"
//             />
//           </LineChart>
//         </div>
//       </div>

//       {/* Department Performance */}
//       <div className="bg-white rounded-lg shadow p-6 mb-8">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
//         <BarChart width={800} height={400} data={data.departmentAverages}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="department_name" />
//           <YAxis />
//           <Tooltip />
//           <Legend />
//           <Bar dataKey="avg_percentage" name="Average Percentage" fill="#8884d8" />
//           <Bar dataKey="evaluation_count" name="Number of Evaluations" fill="#82ca9d" />
//         </BarChart>
//       </div>

//       {/* Recent Evaluations */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h3 className="text-lg font-medium text-gray-900">Recent Evaluations</h3>
//         </div>
//         <div className="divide-y divide-gray-200">
//           {data.recentEvaluations.map((eval) => (
//             <div key={eval.id} className="px-6 py-4">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">{eval.employee.nameEn}</p>
//                   <p className="text-sm text-gray-500">{eval.employee.department.name}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm font-medium text-gray-900">{eval.percentage.toFixed(2)}%</p>
//                   <p className="text-sm text-gray-500">Grade: {eval.grade}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
