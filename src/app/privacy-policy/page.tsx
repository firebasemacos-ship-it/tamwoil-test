import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 direction-rtl" dir="rtl">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <header className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">سياسة الخصوصية</h1>
                    <p className="text-gray-600">آخر تحديث: 28 يناير 2026</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. مقدمة</h2>
                        <p className="text-gray-700 leading-relaxed">
                            نحن في تطبيق "تمويل" (Tamwoil) نولي اهتماماً كبيراً لخصوصية مستخدمينا. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية البيانات الشخصية التي تشاركها معنا عند استخدام التطبيق أو الموقع الإلكتروني.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. البيانات التي نجمعها</h2>
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li><strong>المعلومات الشخصية:</strong> مثل الاسم، رقم الهاتف، والبريد الإلكتروني عند التسجيل.</li>
                            <li><strong>بيانات الشحن:</strong> عناوين الاستلام والتسليم، وتفاصيل الطلبات والمحتويات.</li>
                            <li><strong>البيانات التقنية:</strong> نوع الجهاز، نظام التشغيل، ومعرفات الجهاز لتحسين تجربة المستخدم وإرسال الإشعارات.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. كيف نستخدم بياناتك</h2>
                        <p className="text-gray-700 leading-relaxed">
                            نستخدم البيانات التي نجمعها للأغراض التالية:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                            <li>تنفيذ طلبات الشحن والتوصيل وتتبعها.</li>
                            <li>التواصل معك بخصوص حالة شحناتك وتحديثات الخدمة.</li>
                            <li>تحسين جودة خدماتنا وحل المشكلات التقنية.</li>
                            <li>إرسال إشعارات ترويجية (يمكنك إلغاء الاشتراك فيها في أي وقت).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. مشاركة البيانات</h2>
                        <p className="text-gray-700 leading-relaxed">
                            نحن لا نبيع بياناتك لأطراف ثالثة. ومع ذلك، قد نشارك بعض المعلومات الضرورية مع:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                            <li><strong>مندوبي التوصيل:</strong> لتسليم الشحنات إلى العنوان الصحيح.</li>
                            <li><strong>الجهات القانونية:</strong> إذا تطلب القانون ذلك أو لحماية حقوقنا.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. أمن البيانات</h2>
                        <p className="text-gray-700 leading-relaxed">
                            نحن نتخذ تدابير أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفشاء. نستخدم تقنيات التشفير والبروتوكولات الآمنة لحماية المعلومات الحساسة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. حذف الحساب والبيانات</h2>
                        <p className="text-gray-700 leading-relaxed">
                            يحق لك طلب حذف حسابك وبياناتك الشخصية في أي وقت من خلال إعدادات التطبيق أو التواصل معنا مباشرة. سيتم إزالة جميع بياناتك المرتبطة باستثناء ما يتطلب القانون الاحتفاظ به لأغراض السجلات المالية.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. اتصل بنا</h2>
                        <p className="text-gray-700 leading-relaxed">
                            إذا كان لديك أي استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر:
                        </p>
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-800">البريد الإلكتروني: <a href="mailto:support@tamweelsys.app" className="text-blue-600 hover:underline">support@tamweelsys.app</a></p>
                            <p className="text-gray-800 mt-1">الهاتف: +218 94 444 4170</p>
                        </div>
                    </section>
                </div>

                <footer className="mt-12 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} تمويل. جميع الحقوق محفوظة.
                </footer>
            </div>
        </div>
    );
}
