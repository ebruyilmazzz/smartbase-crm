import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SMARTBASE CRM database seed...');

  // Clean existing data
  await prisma.activity.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.customerRequest.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.companyContact.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.customStatus.deleteMany({});
  await prisma.customPriority.deleteMany({});

  console.log('🧹 Cleaned previous database entries.');

  // 1. Create Default Custom Statuses
  const defaultStatuses = [
    // Company Statuses
    { name: 'Lead', category: 'COMPANY', color: '#6366f1', order: 1 },
    { name: 'Analysis', category: 'COMPANY', color: '#f59e0b', order: 2 },
    { name: 'Active', category: 'COMPANY', color: '#10b981', order: 3 },
    { name: 'Passive', category: 'COMPANY', color: '#94a3b8', order: 4 },
    { name: 'Completed', category: 'COMPANY', color: '#3b82f6', order: 5 },

    // Task Statuses
    { name: 'Pending', category: 'TASK', color: '#94a3b8', order: 1 },
    { name: 'Analysis', category: 'TASK', color: '#f59e0b', order: 2 },
    { name: 'Planned', category: 'TASK', color: '#8b5cf6', order: 3 },
    { name: 'Development', category: 'TASK', color: '#3b82f6', order: 4 },
    { name: 'Testing', category: 'TASK', color: '#ec4899', order: 5 },
    { name: 'Customer Approval', category: 'TASK', color: '#eab308', order: 6 },
    { name: 'Completed', category: 'TASK', color: '#10b981', order: 7 },
    { name: 'Cancelled', category: 'TASK', color: '#ef4444', order: 8 },

    // Request Statuses
    { name: 'New', category: 'REQUEST', color: '#6366f1', order: 1 },
    { name: 'Analysis', category: 'REQUEST', color: '#f59e0b', order: 2 },
    { name: 'Development', category: 'REQUEST', color: '#3b82f6', order: 3 },
    { name: 'Waiting for Customer', category: 'REQUEST', color: '#eab308', order: 4 },
    { name: 'Completed', category: 'REQUEST', color: '#10b981', order: 5 },
    { name: 'Cancelled', category: 'REQUEST', color: '#ef4444', order: 6 },
  ];

  for (const s of defaultStatuses) {
    await prisma.customStatus.create({ data: s });
  }

  // 2. Create Default Priorities
  const defaultPriorities = [
    { name: 'Urgent', color: 'red', order: 1 },
    { name: 'High', color: 'orange', order: 2 },
    { name: 'Medium', color: 'yellow', order: 3 },
    { name: 'Low', color: 'gray', order: 4 },
  ];

  for (const p of defaultPriorities) {
    await prisma.customPriority.create({ data: p });
  }

  console.log('✅ Created default statuses & priorities.');

  // 3. Create Seed Users
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const salesPassword = await bcrypt.hash('Sales123!', 10);
  const devPassword = await bcrypt.hash('Dev123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@smartbase.com',
      password: adminPassword,
      name: 'Ebru Yılmaz',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const salesRep = await prisma.user.create({
    data: {
      email: 'sales@smartbase.com',
      password: salesPassword,
      name: 'Ahmet Kaya',
      role: 'SALES',
      status: 'ACTIVE',
    },
  });

  const developer = await prisma.user.create({
    data: {
      email: 'dev@smartbase.com',
      password: devPassword,
      name: 'Mehmet Demir',
      role: 'DEVELOPER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seed users created: Ebru (Admin), Ahmet (Sales), Mehmet (Dev)');

  // 4. Create Companies & Contacts
  // Customer 1: Nova Wood (as required by prompt)
  const novaWood = await prisma.company.create({
    data: {
      companyName: 'Nova Wood',
      status: 'Active',
      industry: 'Mobilya İmalatı & Ağaç Sanayi',
      description:
        'Özel CNC üretimi ve toptan ticaret ile mutfak dolap kapağı imalatı. Mevcut cari ve makro program operasyonları yönetmede yetersiz kaldığı için iş yönetimi ve sipariş takibini merkezi ERP/iş yönetim sistemine geçirmeyi hedefliyor.',
      website: 'https://www.novawood.com.tr',
      phone: '+90 (212) 555 4321',
      email: 'info@novawood.com.tr',
      address: 'İkitelli OSB Keresteciler Sitesi 4. Blok No:18 Başakşehir / İstanbul',
      taxNumber: '6320491823',
      currentSoftware: 'Cari Entegrasyonlu Makro Programı',
      eInvoiceStatus: 'Evet',
      eLedgerStatus: 'Evet',
      contacts: {
        create: [
          {
            name: 'Hasan Bey',
            position: 'Genel Müdür / Şirket Ortağı',
            phone: '+90 (532) 111 2233',
            email: 'hasan@novawood.com.tr',
            isPrimary: true,
          },
          {
            name: 'Ayşe Hanım',
            position: 'Üretim ve Sipariş Sorumlusu',
            phone: '+90 (533) 222 3344',
            email: 'ayse@novawood.com.tr',
            isPrimary: false,
          },
        ],
      },
    },
  });

  // Customer 2: ABC Ltd.
  const abcLtd = await prisma.company.create({
    data: {
      companyName: 'ABC Endüstriyel Ltd. Şti.',
      status: 'Active',
      industry: 'Endüstriyel Üretim & Metal İşleme',
      description: 'CNC sac işleme, büküm ve lazer kesim tesisi. Sevkiyat ve depo stok takip sisteminin yenilenmesi talep ediliyor.',
      website: 'https://www.abcendustri.com',
      phone: '+90 (216) 444 8899',
      email: 'iletisim@abcendustri.com',
      address: 'Dudullu OSB 1. Cadde No:44 Ümraniye / İstanbul',
      taxNumber: '1029384756',
      currentSoftware: 'Logo Tiger + Excel Raporlama',
      eInvoiceStatus: 'Evet',
      eLedgerStatus: 'Evet',
      contacts: {
        create: [
          {
            name: 'Kemal Akın',
            position: 'Fabrika Müdürü',
            phone: '+90 (535) 999 8877',
            email: 'kemal.akin@abcendustri.com',
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Customer 3: XYZ Company
  const xyzCompany = await prisma.company.create({
    data: {
      companyName: 'XYZ Teknoloji ve Dağıtım A.Ş.',
      status: 'Analysis',
      industry: 'Bilişim & Dağıtım',
      description: 'Donanım ve çevre birimleri dağıtıcısı. B2B portal ve cari bakiye entegrasyonu projesi planlama aşamasında.',
      website: 'https://www.xyzteknoloji.com',
      phone: '+90 (312) 222 3344',
      email: 'satis@xyzteknoloji.com',
      address: 'ODTÜ Teknokent Silikon Blok Kat:3 Çankaya / Ankara',
      taxNumber: '9988776655',
      currentSoftware: 'Mikro V16',
      eInvoiceStatus: 'Evet',
      eLedgerStatus: 'Süreçte',
      contacts: {
        create: [
          {
            name: 'Selin Doğan',
            position: 'Operasyon Direktörü',
            phone: '+90 (542) 777 6655',
            email: 'selin.dogan@xyzteknoloji.com',
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log('✅ Companies created: Nova Wood, ABC Ltd., XYZ Teknoloji');

  // 5. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'CNC Üretim Entegrasyonu ve Sipariş Takip Modülü',
      description:
        'Hasan Bey ile mutabık kalınan özel CNC panel ebatlama ve kapak siparişlerinin ERP üzerinden anlık üretim bandına aktarılması.',
      companyId: novaWood.id,
      status: 'Development',
      priority: 'Urgent',
      assignedUserId: developer.id,
      createdById: admin.id,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'E-Fatura ve Cari Hesap Otomatik Senkronizasyonu',
      description: 'Nova Wood muhasebe sistemi ile SmartBase ERP arasında çift yönlü cari hareket ve e-fatura XML aktarım servisi.',
      companyId: novaWood.id,
      status: 'Testing',
      priority: 'High',
      assignedUserId: developer.id,
      createdById: salesRep.id,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'ABC Ltd. Sevkiyat ve Barkodlu Depo Doğrulama',
      description: 'Lazer kesim parçaların paletleme ve sevk öncesi el terminalleriyle taranarak siparişle eşleştirilmesi.',
      companyId: abcLtd.id,
      status: 'Planned',
      priority: 'Medium',
      assignedUserId: developer.id,
      createdById: salesRep.id,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'XYZ B2B Bayi Giriş Ekranı & Sipariş Formu',
      description: 'Bayilerin cari bakiye kontrolü ile sipariş girebileceği responsive arayüz mimarisi.',
      companyId: xyzCompany.id,
      status: 'Analysis',
      priority: 'High',
      assignedUserId: developer.id,
      createdById: admin.id,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Nova Wood İlk Kullanıcı Eğitimi ve Veri Aktarımı',
      description: 'Eski makro programdaki 2400 müşteri cari kaydı ve açık siparişlerin sisteme aktarımı tamamlandı.',
      companyId: novaWood.id,
      status: 'Completed',
      priority: 'Medium',
      assignedUserId: salesRep.id,
      createdById: admin.id,
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Tasks created.');

  // 6. Create Customer Requests
  const req1 = await prisma.customerRequest.create({
    data: {
      title: 'Özel Ebat Mutfak Kapağı Fire Oranı Hesabı Ekleme',
      description: 'Kullanıcılar CNC kesim öncesi m2 ve fire maliyetini sipariş teklif fişinde görmek istiyor.',
      requestedBy: 'Hasan Bey (Nova Wood)',
      companyId: novaWood.id,
      priority: 'High',
      status: 'Development',
      assignedUserId: developer.id,
      createdById: salesRep.id,
      solution: 'Algoritma hazırlandı, formül katsayıları veritabanı parametre tablosuna bağlandı.',
    },
  });

  const req2 = await prisma.customerRequest.create({
    data: {
      title: 'ABC Ltd. İrsaliye PDF Şablonuna QR Kod Eklenmesi',
      description: 'GİB standartlarına uygun karekodun irsaliye çıktısında sağ üst köşede basılması.',
      requestedBy: 'Kemal Akın (ABC Ltd.)',
      companyId: abcLtd.id,
      priority: 'Medium',
      status: 'Completed',
      assignedUserId: developer.id,
      createdById: salesRep.id,
      solution: 'PDF oluşturma motoruna QR kod generatörü entegre edildi ve şablona yerleştirildi.',
    },
  });

  const req3 = await prisma.customerRequest.create({
    data: {
      title: 'XYZ B2B Siparişlerinde Kredi Kartı ile Ödeme Alma Talebi',
      description: 'Sanal POS entegrasyonu ile sipariş anında tek çekim veya taksitli tahsilat yeteneği.',
      requestedBy: 'Selin Doğan (XYZ Teknoloji)',
      companyId: xyzCompany.id,
      priority: 'Urgent',
      status: 'New',
      assignedUserId: developer.id,
      createdById: admin.id,
    },
  });

  console.log('✅ Customer Requests created.');

  // 7. Create Notes
  await prisma.note.create({
    data: {
      content:
        'Hasan Bey ile toplantı yapıldı. Makro programlarındaki en büyük darboğazın üretimdeki sipariş durumunu muhasebeye geç aktarmak olduğunu belirtti. ERP lansmanında bu önceliklendirilecek.',
      createdById: admin.id,
      companyId: novaWood.id,
    },
  });

  await prisma.note.create({
    data: {
      content: 'CNC entegrasyonu için makine üreticisinin sağladığı TCP/IP soket protokolü dökümantasyonu incelendi.',
      createdById: developer.id,
      taskId: task1.id,
      companyId: novaWood.id,
    },
  });

  await prisma.note.create({
    data: {
      content: 'Test ortamında e-fatura senkronizasyonu 100 test faturası ile doğrulandı, canlı ortama geçiş haftasonu planlandı.',
      createdById: developer.id,
      taskId: task2.id,
      companyId: novaWood.id,
    },
  });

  console.log('✅ Notes created.');

  // 8. Create Activity Logs
  const activities = [
    {
      userId: admin.id,
      companyId: novaWood.id,
      action: 'COMPANY_CREATED',
      description: 'Ebru Yılmaz, "Nova Wood" adlı yeni müşteriyi sisteme ekledi.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      userId: salesRep.id,
      companyId: novaWood.id,
      taskId: task1.id,
      action: 'TASK_CREATED',
      description: 'Ahmet Kaya, "Nova Wood" için "CNC Üretim Entegrasyonu" işini açtı.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: developer.id,
      companyId: novaWood.id,
      taskId: task1.id,
      action: 'TASK_STATUS_CHANGED',
      description: 'Mehmet Demir, "CNC Üretim Entegrasyonu" işinin durumunu "Analysis" -> "Development" olarak güncelledi.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: salesRep.id,
      companyId: abcLtd.id,
      action: 'COMPANY_CREATED',
      description: 'Ahmet Kaya, "ABC Endüstriyel Ltd. Şti." müşterisini kaydetti.',
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    },
    {
      userId: developer.id,
      companyId: abcLtd.id,
      requestId: req2.id,
      action: 'REQUEST_STATUS_CHANGED',
      description: 'Mehmet Demir, "ABC Ltd. İrsaliye PDF Şablonuna QR Kod Eklenmesi" talebini tamamladı.',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      userId: admin.id,
      companyId: xyzCompany.id,
      requestId: req3.id,
      action: 'REQUEST_CREATED',
      description: 'Ebru Yılmaz, "XYZ Teknoloji" için "Sanal POS Ödeme Alma" talebini sisteme girdi.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      userId: developer.id,
      companyId: novaWood.id,
      taskId: task2.id,
      action: 'TASK_STATUS_CHANGED',
      description: 'Mehmet Demir, "E-Fatura ve Cari Hesap Otomatik Senkronizasyonu" işini "Testing" aşamasına aldı.',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  for (const act of activities) {
    await prisma.activity.create({ data: act });
  }

  console.log('✅ Activity timeline seeded.');
  console.log('🎉 SMARTBASE CRM database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
