# GS MON ECOLE · منصة التتبع التربوي والانضباط المدرسي

![Interface arabe RTL](https://img.shields.io/badge/Interface-Arabe_RTL-0f172a)
![Application statique](https://img.shields.io/badge/Application-HTML_CSS_JavaScript-f59e0b)
![Hébergement](https://img.shields.io/badge/Hébergement-GitHub_Pages-047857)

**مجموعة مدارس مون إيكول — تطوان**  
أكاديمية جهة طنجة - تطوان - الحسيمة · المديرية الإقليمية بتطوان

[فتح المنصة / Ouvrir la plateforme](https://drissazam.github.io/gs-mon-ecole/) · [Code source](https://github.com/drissazam/gs-mon-ecole)

> Adresse de production configurée ci-dessus. Sa disponibilité dépend de la publication effective et de l’activation de GitHub Pages.

![Aperçu institutionnel de la plateforme](assets/img/og-preview.png)

## تقديم المنصة

تطبيق ويب محلي لإعداد إحالات تربوية فردية أو جماعية، واستخراج بطاقة رسمية A5 أو صورة PNG عالية الدقة لمشاركتها مع الحراسة العامة. لا يوجد حساب دخول أو خادم لتخزين لوائح التلاميذ.

- التعليم الابتدائي: المستويات الستة.
- الإعدادي: المسار الدولي فقط، 1AC و2AC و3AC.
- التأهيلي: الجذع المشترك العلمي، أولى بكالوريا علوم تجريبية أو رياضية أو اقتصادية، وثانية بكالوريا علوم فيزيائية PC.
- اختيار عدة تلاميذ مع شارات إزالة وعدّاد، أو إضافة اسم غير مسجل يدوياً.
- اختيار مادة مقترحة أو «مادة أخرى…» مع حفظ المادة المخصصة.
- تصفير التقارير والإحصائيات عند 07:00 بتوقيت المغرب، مع الاحتفاظ بلائحة التلاميذ.
- شعارا المؤسسة والوزارة مضمنان بصيغة Base64 لتصيير الوثائق محلياً.

## دليل الأستاذ(ة)

1. اكتب اسمك؛ الخانة فارغة عند فتح الصفحة. اختر المادة أو اكتب مادة أخرى.
2. حدد السلك والمستوى والقسم والقاعة. ابحث بالاسم أو برقم مسار واختر التلميذ؛ يمكن إضافة عدة تلاميذ أو استعمال زر «إضافة التلميذ» ومفتاح Enter.
3. حدد المخالفات وأضف الملاحظات عند الحاجة.
4. حمّل PDF A5، أو أنشئ صورة PNG للمشاركة. عند ظهور قائمة المشاركة اختر WhatsApp ثم المستلم وأكد الإرسال.
5. إذا لم يدعم الجهاز مشاركة الملفات، نزّل الصورة وأرفقها بالمحادثة، أو استخدم النسخ واللصق إذا كان متاحاً.

الإرسال ليس تلقائياً ولا يؤكد التطبيق استلام التقرير. تبقى الأزرار قابلة للاستخدام؛ أثناء التصيير يمنع التطبيق تداخل عمليتين ويعرض حالة واضحة. إذا تجاوز المحتوى مساحة A5، يطلب اختصاره أو تقسيم الإحالة إلى مجموعات أصغر دون حذف النص.

## دليل الإدارة وحفظ البيانات

استورد ملف Excel أو CSV من تبويب لوائح مسار. العناوين المدعومة تشمل: رقم مسار / Code Massar، الاسم / Nom، Prénom، المستوى / Niveau، القسم / Classe. يدمج الاستيراد التلاميذ مع القائمة الموجودة ويحدّث المطابقين برقم مسار؛ لا يولّد أرقام مسار وهمية. يمكن الإضافة والحذف الفردي يدوياً.

تبقى القوائم في المتصفح والجهاز المستعملين، ولا تُنشر في مستودع GitHub. الاحتفاظ دائم ضمن التخزين المتاح، لكنه لا يصمد أمام مسح بيانات المتصفح أو تبديل الجهاز/عنوان الموقع. احتفظ بملفات مسار الأصلية لإعادة الاستيراد. لا تنقل عملية النشر تلقائياً بيانات localhost إلى عنوان الإنتاج.

تبدأ الدورة اليومية عند 07:00 في Africa/Casablanca مع مراعاة تغيير التوقيت. عند بقاء الصفحة مفتوحة يعمل المؤقت، وعند عودة التطبيق من التعليق أو فتحه مجدداً تُطبّق المراجعة فوراً. التقارير السابقة تُزال من السجل، أما ملفات PDF/PNG التي سبق تنزيلها ولوائح التلاميذ فلا يمسها ذلك.

## Présentation et utilisation

Application statique en arabe RTL pour le Groupe Scolaire Mon École, Tétouan. Elle prépare des rapports individuels ou collectifs et des documents A5 avec logos, identité institutionnelle, matière réelle et signatures.

**Enseignant :** saisir son nom, choisir une matière ou une matière personnalisée, ajouter les élèves, sélectionner les motifs, puis télécharger le PDF ou partager le PNG. Le partage natif dépend du navigateur ; le téléchargement reste une alternative. Une seconde pression sur « partager l’image prête » peut être nécessaire après le rendu.

**Administration :** importer la liste Massar depuis Excel/CSV, vérifier les niveaux proposés et renseigner éventuellement le numéro WhatsApp. L’identité de l’établissement reste fixe. Les données sont propres à chaque navigateur ; aucun serveur de synchronisation, compte utilisateur ou accusé de réception n’est fourni.

## Installation sur téléphone

- Android : ouvrir l’adresse HTTPS dans Chrome puis utiliser « Installer l’application » ou « Ajouter à l’écran d’accueil », selon le navigateur.
- iPhone : ouvrir dans Safari, menu Partager, puis « Sur l’écran d’accueil ».
- Le manifest utilise une portée relative et de vraies icônes PNG de 192, 512 et 180 pixels. Un service worker met en cache uniquement les fichiers publics de l’application après le premier chargement réussi.
- Le fonctionnement hors connexion couvre l’interface et les exports locaux. WhatsApp et le premier chargement nécessitent le réseau. Les possibilités exactes d’installation et de partage varient selon le navigateur et l’appareil.

## Déploiement GitHub Pages

Le dossier racine contient directement `index.html`. Aucune compilation ni dépendance Node n’est requise.

1. Publier ce dossier dans le dépôt public `drissazam/gs-mon-ecole`, branche `main`.
2. Dans **Settings → Pages**, sélectionner **Deploy from a branch**, puis `main` et `/(root)`.
3. Attendre la fin de la publication et ouvrir **https://drissazam.github.io/gs-mon-ecole/**.

Le fichier `.nojekyll` désactive Jekyll. Les ressources, le manifest et le service worker utilisent des chemins relatifs compatibles avec le sous-répertoire du dépôt. Pour renommer le dépôt, adapter les URL absolues de partage/canonique dans `index.html` et les liens de ce README.

L’image Open Graph publique est `assets/img/og-preview.png` (1200 × 630). Les métadonnées sont présentes dans le HTML initial. L’affichage et le rafraîchissement de la vignette dépendent aussi du cache de l’application de messagerie.

## Maintenance

- Modifier `index.html`, `assets/css/style-main.css` et `assets/js/app-main.js`, puis publier un nouveau commit.
- Lors d’une modification des ressources, changer la version du cache dans `sw.js`. Fermer les anciennes fenêtres pour permettre l’activation du nouveau service worker.
- En cas de changement de logo, régénérer également les données de `assets/js/logos-data.js` et les icônes concernées.
- Ne jamais ajouter de fichiers d’élèves, rapports, identifiants ou archives de travail au dépôt public. `.gitignore` exclut ces formats et les répertoires temporaires.
- Les bibliothèques locales html2pdf.js, SheetJS et Chart.js conservent leurs notices dans les fichiers distribués. La police Cairo est locale ; aucun CDN n’est nécessaire au fonctionnement.

## Vérifications de la version

Tests ciblés : arborescence scolaire, démarrage sans élèves fictifs, conservation des imports à 07:00, bascule du fuseau marocain en période de Ramadan, champ enseignant vide, matière personnalisée et échappement HTML. Vérification navigateur sous `/gs-mon-ecole/`, formats mobiles de 320 à 412 px et fiche PDF collective d’une page avec trois élèves et dix motifs.

La simulation responsive ne remplace pas un essai physique sur Safari iPhone et Chrome Android. Aucun message réel n’est envoyé pendant les tests de partage. Le PDF est une image haute définition à l’échelle ×3 (environ 288 pixels/pouce à taille A5), avec un contrôle de débordement avant export.
