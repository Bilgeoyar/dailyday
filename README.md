# LifeQuest

LifeTown, FocusWorld ve SkillHero fikirlerini birleştiren, GitHub Pages üzerinde çalışan statik web uygulaması.

## İçerik

- Parolalı giriş ekranı
- PBKDF2-SHA-256 parola doğrulaması
- Paroladan türetilen anahtarla AES-GCM şifreli yerel veri
- Karakter adı, avatar, seviye, XP ve altın sistemi
- Görev ekleme ve ödül sistemi
- Pomodoro/odak zamanlayıcısı
- Dört beceri alanı
- Altınla yükseltilebilen kişisel şehir
- Şifreli yedek dışa aktarma ve geri yükleme
- Çevrimdışı çalışma ve PWA desteği
- Mobil uyumlu arayüz

## İlk giriş

Geçici parola teslim notunda paylaşılmıştır. Yayınlamadan önce değiştirin.

## Parolayı değiştirme

1. `tools/password-generator.html` dosyasını tarayıcıda açın.
2. En az 12 karakterlik güçlü bir parola yazın.
3. Üretilen metni kopyalayın.
4. `auth-config.js` dosyasının içeriğini bu metinle değiştirin.
5. Dosyaları GitHub'a gönderin.

Parola değiştiğinde eski tarayıcı kaydı çözülemez. Önce profil sayfasından şifreli yedek alın; gerekirse verileri sıfırlayın.

## GitHub Pages yayını

1. GitHub'da yeni bir depo oluşturun.
2. Bu klasörün içindeki dosyaları deponun köküne yükleyin. Klasörün kendisini üst klasör olarak yüklemeyin.
3. Depoda **Settings → Pages** bölümünü açın.
4. **Build and deployment** altında **Deploy from a branch** seçin.
5. Branch olarak `main`, klasör olarak `/(root)` seçin ve kaydedin.
6. GitHub'ın oluşturduğu Pages adresini açın.

## Yerel test

Dosyaları doğrudan çift tıklamak yerine küçük bir yerel sunucu kullanın:

```bash
python -m http.server 8080
```

Ardından tarayıcıda `http://localhost:8080` adresini açın.

## Güvenlik sınırı

GitHub Pages statik barındırmadır. Sunucu tarafı oturum, kullanıcı hesabı veya erişim denetimi çalıştırmaz. Bu projedeki yöntem:

- Düz parolayı kaynak koda koymaz.
- PBKDF2 ile parola doğrular.
- Uygulama verisini AES-GCM ile şifreler.
- Sıradan ziyaretçilerin arayüze girmesini engeller.

Fakat depo herkese açıksa kaynak dosyaları indirilebilir ve parola doğrulama değeri çevrimdışı parola tahmin saldırısına açıktır. Gizli, kişisel veya kurumsal bilgiler için Firebase Authentication, Supabase Auth, Cloudflare Access ya da sunucu tarafı bir giriş sistemi kullanılmalıdır.

## Dosyalar

- `index.html`: Uygulama arayüzü
- `styles.css`: Tasarım ve mobil uyumluluk
- `app.js`: Uygulama, şifreleme ve oyun mantığı
- `auth-config.js`: Parola doğrulama yapılandırması
- `tools/password-generator.html`: Yeni parola yapılandırması üretme aracı
- `manifest.webmanifest`, `sw.js`, `icon.svg`: PWA/çevrimdışı destek
