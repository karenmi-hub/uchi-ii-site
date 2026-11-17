/* ==========================================================================
   Учи ИИ — курс «ML для продвинутых» (ml.html).
   Формат подсмотрен у Hugging Face Learn: главы слева, урок с кодом, который
   можно скопировать и запустить в Colab, тест в конце главы, прогресс в браузере.
   Структура и идеи примеров — по Hugging Face LLM Course (Apache 2.0,
   https://github.com/huggingface/course). Тексты написаны заново, по-русски,
   примеры — на русскоязычных моделях и датасетах с проверенными лицензиями.
   ========================================================================== */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function code(src) { return '<div class="code"><button type="button" class="code-copy">Скопировать</button><pre><code>' + esc(src.replace(/^\n|\n$/g, '')) + '</code></pre></div>'; }
  function note(t) { return '<div class="ml-note">' + t + '</div>'; }

  var CH = [
    { t: 'Перед стартом', lessons: [
      { t: 'Как устроен курс', h: `
<p>Этот курс — для тех, кто уже уверенно пользуется нейросетями и хочет заглянуть внутрь: как устроены языковые модели, где их брать и как дообучить модель под свою задачу.</p>
<h3>Что понадобится</h3>
<ul><li><b>Python на базовом уровне:</b> переменные, функции, списки, словари.</li>
<li><b>Аккаунт Google</b> — код запускаем в Google Colab: это бесплатные «тетради» с видеокартой, ничего ставить на компьютер не нужно.</li>
<li><b>Английский для чтения:</b> документация библиотек — на английском.</li></ul>
<h3>Как заниматься</h3>
<ol><li>Читаете урок.</li><li>Копируете код кнопкой «Скопировать», вставляете в ячейку Colab и запускаете.</li><li>Меняете пример под себя — так запоминается лучше всего.</li><li>В конце главы — короткий тест.</li></ol>
<p>Прогресс сохраняется в этом браузере. Одна глава — примерно вечер.</p>
` + note('<b>Первая ячейка в Colab.</b> Запустите её один раз в начале работы — она ставит библиотеки:') + code(`
!pip install -q transformers datasets accelerate
`) + `<p>В меню Colab выберите «Среда выполнения → Сменить среду выполнения → T4 GPU»: с видеокартой дообучение идёт в десятки раз быстрее.</p>
<h3>Откуда материал</h3>
<p>Структура курса и идеи примеров взяты из открытого курса <a href="https://huggingface.co/learn/llm-course" target="_blank" rel="noopener">Hugging Face LLM Course</a> (лицензия Apache 2.0). Тексты мы написали заново по-русски, а примеры перевели на русскоязычные модели и датасеты.</p>` }
    ] },
    { t: 'Трансформеры', lessons: [
      { t: 'Первая модель за три строки', h: `
<p>Библиотека <b>Transformers</b> позволяет запустить готовую модель, не зная, как она устроена. Для этого есть функция <code>pipeline</code>: вы называете задачу и модель, а она сама скачивает веса и готовит текст.</p>
<p>Попросим русскую модель угадать пропущенное слово:</p>` + code(`
from transformers import pipeline

fill = pipeline("fill-mask", model="ai-forever/ruBert-base")

for r in fill("Столица России — [MASK].")[:3]:
    print(r["token_str"], round(r["score"], 3))
`) + `<p>Модель вернёт несколько вариантов с вероятностью каждого. Это и есть суть языковой модели: <b>она оценивает, какое слово вероятнее всего стоит на этом месте</b>. ChatGPT, DeepSeek и Qwen делают то же самое, только предсказывают следующее слово — раз за разом.</p>
<h3>Какие задачи умеет pipeline</h3>
<ul><li><code>text-classification</code> — отнести текст к классу: отзыв положительный или отрицательный, письмо — жалоба или вопрос;</li>
<li><code>token-classification</code> — найти в тексте имена, компании, суммы;</li>
<li><code>question-answering</code> — найти ответ на вопрос в данном тексте;</li>
<li><code>summarization</code>, <code>translation</code> — пересказ и перевод;</li>
<li><code>text-generation</code> — продолжить текст.</li></ul>` + note('<b>Попробуйте сами.</b> Замените фразу на свою, оставив одно <code>[MASK]</code>. Где модель угадывает уверенно, а где ошибается? Обычно она сильна в устойчивых выражениях и слаба в фактах — запомните это, пригодится.') },
      { t: 'Что происходит внутри', h: `
<p>Модель не видит букв и слов. Путь текста выглядит так:</p>
<ol><li><b>Токенизация.</b> Текст режется на токены — слова или их кусочки. Каждому токену соответствует номер.</li>
<li><b>Эмбеддинги.</b> Каждый номер превращается в вектор — список из сотен чисел. Близкие по смыслу слова получают близкие векторы.</li>
<li><b>Слои внимания.</b> На каждом слое каждый токен «смотрит» на остальные и уточняет свой вектор с учётом контекста. Так слово «ключ» в «ключ от двери» и «ключ к успеху» получает разные векторы.</li>
<li><b>Голова.</b> Последний маленький слой превращает векторы в ответ: вероятности слов, классов или позиций.</li></ol>
<h3>Три семейства моделей</h3>
<table class="ml-t"><thead><tr><th>Тип</th><th>Как читает текст</th><th>Для чего</th><th>Примеры</th></tr></thead><tbody>
<tr><td>Энкодер</td><td>весь сразу, в обе стороны</td><td>понять текст: классификация, поиск, извлечение</td><td>BERT, ruBERT</td></tr>
<tr><td>Декодер</td><td>слева направо</td><td>писать текст</td><td>GPT, DeepSeek, Qwen</td></tr>
<tr><td>Энкодер-декодер</td><td>читает целиком, пишет по слову</td><td>перевод, пересказ</td><td>T5, BART</td></tr></tbody></table>
<p>Практический вывод: <b>для классификации писем или отзывов не нужна огромная генеративная модель</b>. Маленький энкодер, дообученный на ваших данных, справится быстрее, дешевле и часто точнее — и будет работать на вашем сервере.</p>
<h3>Предобучение и дообучение</h3>
<p>Обучить модель с нуля — это месяцы работы кластера видеокарт. Поэтому берут <b>предобученную</b> модель, которая уже «знает язык», и <b>дообучают</b> её на небольшом наборе своих примеров. На это хватает бесплатного Colab и получаса. Этим мы и займёмся в главе 4.</p>` }
    ], quiz: [
      { q: 'Что делает языковая модель на самом базовом уровне?', o: ['Ищет ответ в интернете', 'Оценивает, какое слово вероятнее всего стоит на этом месте', 'Сверяет текст со словарём'], a: 1, e: 'Всё остальное — следствие: текст рождается из повторяющегося предсказания следующего токена.' },
      { q: 'Нужно раскладывать входящие письма по трём папкам. Что взять?', o: ['Самую большую генеративную модель', 'Небольшой энкодер и дообучить его на своих письмах', 'Модель для перевода'], a: 1, e: 'Классификация — задача на понимание текста. Маленький энкодер дешевле, быстрее и работает у вас.' },
      { q: 'Зачем нужны слои внимания?', o: ['Чтобы токен учитывал контекст — соседние слова', 'Чтобы ускорить скачивание модели', 'Чтобы исправлять опечатки'], a: 0, e: 'Благодаря вниманию одно и то же слово получает разный вектор в разном контексте.' }
    ] },
    { t: 'Модели и токенизаторы', lessons: [
      { t: 'Токенизатор и модель своими руками', h: `
<p><code>pipeline</code> удобен, но прячет шаги. Разберём их по одному — это понадобится для дообучения.</p>` + code(`
from transformers import AutoTokenizer, AutoModel

name = "ai-forever/ruBert-base"
tok = AutoTokenizer.from_pretrained(name)

text = "Нейросети ошибаются уверенно."
print(tok.tokenize(text))   # на какие кусочки разрезан текст
enc = tok(text, return_tensors="pt")
print(enc["input_ids"])     # номера токенов
`) + `<p>Обратите внимание: редкие слова режутся на части (у BERT они помечены <code>##</code>), а в начало и конец добавляются служебные токены <code>[CLS]</code> и <code>[SEP]</code>.</p>
<p>Теперь пропустим токены через модель:</p>` + code(`
import torch

model = AutoModel.from_pretrained(name)
with torch.no_grad():
    out = model(**enc)

print(out.last_hidden_state.shape)  # [1, число_токенов, 768]
`) + `<p>На выходе — по вектору из 768 чисел на каждый токен. Сами по себе они ничего не «отвечают»: чтобы получить класс или слово, поверх ставят «голову». Поэтому для задач берут готовые классы — <code>AutoModelForSequenceClassification</code>, <code>AutoModelForTokenClassification</code> и другие.</p>
<h3>Несколько текстов сразу</h3>` + code(`
batch = tok(
    ["Короткий отзыв.", "А это отзыв заметно длиннее предыдущего, на целое предложение."],
    padding=True,       # дополнить короткие до длины самого длинного
    truncation=True,    # обрезать слишком длинные
    max_length=128,
    return_tensors="pt",
)
print(batch["input_ids"].shape, batch["attention_mask"][0])
`) + `<p><code>attention_mask</code> говорит модели, где настоящие токены (1), а где «добивка» (0).</p>` + note('<b>Главное правило.</b> Токенизатор и модель всегда берут с одним и тем же именем. Чужой токенизатор даст модели номера, которые для неё значат совсем другие слова, — ошибки не будет, а ответы станут бессмысленными.') },
      { t: 'Как выбрать модель на Hugging Face Hub', h: `
<p><a href="https://huggingface.co/models" target="_blank" rel="noopener">Hub</a> — это каталог из сотен тысяч моделей. Чтобы не утонуть:</p>
<ol><li><b>Фильтр по задаче</b> (Tasks) и <b>по языку</b> (Languages → Russian).</li>
<li><b>Сортировка по скачиваниям</b>: популярные модели лучше проверены.</li>
<li><b>Карточка модели</b>: на чём обучена, для чего годится, какие ограничения. Нет карточки — повод насторожиться.</li>
<li><b>Лицензия</b> — в шапке карточки. Для работы и бизнеса подходят MIT и Apache 2.0. Пометки <code>NC</code> (non-commercial) и отсутствие лицензии — нельзя.</li>
<li><b>Размер.</b> Чем больше параметров, тем точнее и медленнее. Начинайте с маленькой: если её хватает, большая не нужна.</li></ol>
<h3>С чего начать для русского языка</h3>
<table class="ml-t"><thead><tr><th>Модель</th><th>Что это</th><th>Лицензия</th></tr></thead><tbody>
<tr><td><code>cointegrated/rubert-tiny2</code></td><td>крошечный энкодер: учится за минуты, идеален для первых опытов и простых классификаторов</td><td>MIT</td></tr>
<tr><td><code>ai-forever/ruBert-base</code></td><td>энкодер обычного размера от Сбера: точнее, но медленнее</td><td>Apache 2.0</td></tr>
<tr><td><code>distilbert/distilbert-base-uncased</code></td><td>классика для английских текстов — на ней написано большинство учебных примеров</td><td>Apache 2.0</td></tr></tbody></table>
<p class="mut">Лицензии проверены по карточкам моделей в ноябре 2026 года. Перед использованием в продукте откройте карточку ещё раз.</p>` + note('<b>Задание.</b> Найдите на Hub модель для своей задачи: выберите задачу, русский язык, отсортируйте по скачиваниям. Откройте карточки трёх первых и выпишите лицензию каждой.') }
    ], quiz: [
      { q: 'Почему токенизатор и модель берут с одним именем?', o: ['Так быстрее скачивается', 'У каждой модели свой словарь: чужие номера токенов означают для неё другие слова', 'Иначе Colab выдаст ошибку'], a: 1, e: 'Ошибки как раз не будет — будут бессмысленные ответы. Поэтому это правило стоит помнить.' },
      { q: 'Что означает attention_mask?', o: ['Где настоящие токены, а где «добивка» до общей длины', 'Какие слова важнее', 'Номера слоёв модели'], a: 0, e: 'Единицы — настоящие токены, нули — padding, на них модель не смотрит.' },
      { q: 'У модели на Hub не указана лицензия. Можно ли взять её в платный продукт?', o: ['Да, раз она выложена открыто', 'Нет: без лицензии все права у автора', 'Да, если указать автора'], a: 1, e: 'Открытый доступ — не разрешение. Нужна явная лицензия вроде MIT или Apache 2.0.' }
    ] },
    { t: 'Датасеты', lessons: [
      { t: 'Библиотека datasets', h: `
<p>Модель учится на примерах, а примеры хранятся в датасетах. Библиотека <b>datasets</b> скачивает их с Hub одной строкой. Возьмём русские отзывы о товарах с тремя классами: отрицательный, нейтральный, положительный.</p>` + code(`
from datasets import load_dataset

ds = load_dataset("ai-forever/ru-reviews-classification")
print(ds)               # какие есть части и сколько в них строк
print(ds["train"][0])   # один пример: text, label, label_text
`) + `<p>У датасета три части. <b>train</b> — на ней модель учится. <b>validation</b> — на ней мы проверяем модель по ходу обучения. <b>test</b> — в неё заглядываем один раз в самом конце. Смешивать их нельзя: иначе модель «сдаст экзамен по шпаргалке».</p>
<h3>Посмотреть на данные</h3>` + code(`
from collections import Counter

print(Counter(ds["train"]["label_text"]))   # сколько примеров каждого класса
for row in ds["train"].shuffle(seed=1).select(range(5)):
    print(row["label_text"], "|", row["text"][:80])
`) + `<p>Всегда читайте данные глазами, прежде чем учить. Здесь, например, встречаются отзывы на английском — модель должна быть к ним готова, или их нужно отфильтровать.</p>
<h3>Обработать весь датасет</h3>` + code(`
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("cointegrated/rubert-tiny2")

def tokenize(batch):
    return tok(batch["text"], truncation=True, max_length=128)

ds_tok = ds.map(tokenize, batched=True)          # применить ко всем строкам
short = ds.filter(lambda r: len(r["text"]) < 200)  # оставить только короткие
print(ds_tok["train"].column_names, len(short["train"]))
`) + `<p><code>map</code> с <code>batched=True</code> обрабатывает строки пачками — это в разы быстрее цикла.</p>` + note('<b>Свои данные.</b> Таблица из Excel, сохранённая как CSV, загружается так же: <code>load_dataset("csv", data_files="мои_письма.csv")</code>. Только сначала обезличьте её.') },
      { t: 'Где брать датасеты', h: `
<p>На <a href="https://huggingface.co/datasets" target="_blank" rel="noopener">Hub</a> больше сотни тысяч датасетов. У каждого есть <b>Dataset Viewer</b> — данные можно пролистать прямо в браузере, ничего не скачивая. Смотрите на три вещи: язык, размер и лицензию.</p>
<h3>Можно учиться и использовать в работе</h3>
<table class="ml-t"><thead><tr><th>Датасет</th><th>Что внутри</th><th>Язык</th><th>Лицензия</th></tr></thead><tbody>
<tr><td><a href="https://huggingface.co/datasets/ai-forever/ru-reviews-classification" target="_blank" rel="noopener">ai-forever/ru-reviews-classification</a></td><td>отзывы о товарах, 3 класса тональности, 45 000 примеров для обучения</td><td>русский</td><td>Apache 2.0</td></tr>
<tr><td><a href="https://huggingface.co/datasets/RussianNLP/russian_super_glue" target="_blank" rel="noopener">RussianNLP/russian_super_glue</a></td><td>набор из задач на понимание русского текста — им сравнивают модели</td><td>русский</td><td>MIT</td></tr>
<tr><td><a href="https://huggingface.co/datasets/OpenAssistant/oasst2" target="_blank" rel="noopener">OpenAssistant/oasst2</a></td><td>диалоги людей с ассистентом, ответы оценены людьми</td><td>есть русский</td><td>Apache 2.0</td></tr>
<tr><td><a href="https://huggingface.co/datasets/Vikhrmodels/GrandMaster-PRO-MAX" target="_blank" rel="noopener">Vikhrmodels/GrandMaster-PRO-MAX</a></td><td>задания и ответы для обучения чат-моделей</td><td>русский, английский</td><td>Apache 2.0</td></tr>
<tr><td><a href="https://huggingface.co/datasets/mteb/banking77" target="_blank" rel="noopener">mteb/banking77</a></td><td>обращения клиентов банка, 77 тем — классика для «разложить обращения по темам»</td><td>английский</td><td>MIT</td></tr>
<tr><td><a href="https://huggingface.co/datasets/rajpurkar/squad" target="_blank" rel="noopener">rajpurkar/squad</a></td><td>вопросы и ответы по текстам Википедии</td><td>английский</td><td>CC BY-SA 4.0 — производное под той же лицензией</td></tr>
<tr><td><a href="https://huggingface.co/datasets/wikimedia/wikipedia" target="_blank" rel="noopener">wikimedia/wikipedia</a></td><td>вся Википедия на сотнях языков</td><td>есть русский</td><td>CC BY-SA 3.0</td></tr></tbody></table>
<h3>Только для учёбы — в продукт без проверки не брать</h3>
<table class="ml-t"><thead><tr><th>Датасет</th><th>Почему осторожно</th></tr></thead><tbody>
<tr><td>stanfordnlp/imdb, nyu-mll/glue</td><td>в карточке лицензия «other»: условия у каждой части свои, нужно читать</td></tr>
<tr><td>kuznetsoffandrey/sberquad, IlyaGusev/gazeta</td><td>лицензия в карточке — «unknown»</td></tr>
<tr><td>knkarthick/samsum</td><td>CC BY-NC-ND: коммерческое использование запрещено</td></tr></tbody></table>
<p class="mut">Лицензии проверены по карточкам датасетов в ноябре 2026 года.</p>` + note('<b>Задание.</b> Откройте Dataset Viewer у <code>ai-forever/ru-reviews-classification</code> и найдите пять отзывов, где вы не согласны с меткой. Ошибки в разметке есть в любом датасете — это потолок точности для модели.') }
    ], quiz: [
      { q: 'Зачем датасет делят на train, validation и test?', o: ['Чтобы быстрее скачивался', 'Чтобы честно проверить модель на примерах, которых она не видела', 'Так требует лицензия'], a: 1, e: 'Проверка на тех же данных, на которых модель училась, ничего не говорит о её работе на новых.' },
      { q: 'У датасета лицензия CC BY-NC. Можно ли обучить на нём модель для платного сервиса?', o: ['Да', 'Нет, NC — запрет коммерческого использования', 'Да, если датасет маленький'], a: 1, e: 'NC — non-commercial. Берите датасеты с MIT, Apache 2.0, CC BY, CC0.' },
      { q: 'Что стоит сделать до обучения в первую очередь?', o: ['Прочитать данные глазами и посмотреть баланс классов', 'Увеличить число эпох', 'Выбрать самую большую модель'], a: 0, e: 'Мусор, перекос классов и чужой язык видны глазами за пять минут и экономят часы.' }
    ] },
    { t: 'Дообучение', lessons: [
      { t: 'Учим модель различать отзывы', h: `
<p>Соберём всё вместе: возьмём крошечную русскую модель и научим её определять тональность отзыва. В Colab с видеокартой T4 это занимает несколько минут.</p>
<h3>1. Данные</h3>` + code(`
from datasets import load_dataset
from transformers import AutoTokenizer

name = "cointegrated/rubert-tiny2"
tok = AutoTokenizer.from_pretrained(name)
ds = load_dataset("ai-forever/ru-reviews-classification")

def tokenize(batch):
    return tok(batch["text"], truncation=True, max_length=128)

ds_tok = ds.map(tokenize, batched=True)
train = ds_tok["train"].shuffle(seed=42).select(range(8000))   # для начала хватит 8 000
val = ds_tok["validation"]
`) + `<h3>2. Модель с «головой» на три класса</h3>` + code(`
from transformers import AutoModelForSequenceClassification

labels = {0: "negative", 1: "neutral", 2: "positive"}
model = AutoModelForSequenceClassification.from_pretrained(
    name, num_labels=3, id2label=labels, label2id={v: k for k, v in labels.items()}
)
`) + `<p>Появится предупреждение, что часть весов создана заново, — так и должно быть: «голова» новая, её мы и будем учить.</p>
<h3>3. Обучение</h3>` + code(`
import numpy as np
from transformers import TrainingArguments, Trainer, DataCollatorWithPadding

def metrics(p):
    preds = np.argmax(p.predictions, axis=-1)
    return {"accuracy": float((preds == p.label_ids).mean())}

args = TrainingArguments(
    output_dir="reviews-model",
    eval_strategy="epoch",        # проверять на validation после каждой эпохи
    save_strategy="epoch",
    learning_rate=5e-5,
    per_device_train_batch_size=32,
    per_device_eval_batch_size=64,
    num_train_epochs=3,
    weight_decay=0.01,
    report_to="none",
)

trainer = Trainer(
    model=model, args=args,
    train_dataset=train, eval_dataset=val,
    data_collator=DataCollatorWithPadding(tok),
    compute_metrics=metrics,
)
trainer.train()
`) + `<p>После каждой эпохи вы увидите строку с <code>Training Loss</code>, <code>Validation Loss</code> и <code>Accuracy</code>. Запомните эти три числа — в следующем уроке разберём, как их читать.</p>
<h3>4. Пробуем</h3>` + code(`
from transformers import pipeline

clf = pipeline("text-classification", model=trainer.model, tokenizer=tok)
print(clf(["Пришло быстро, качество отличное!", "Размер не подошёл, ткань так себе.", "Обычная футболка."]))
`) + note('<b>Задание.</b> Придумайте десять своих отзывов, включая хитрые: с иронией, с «не» и с двумя мнениями сразу. На каких модель ошибается? Это и есть список того, чего не хватает в обучающих данных.') },
      { t: 'Как понять, что модель выучила, а не зазубрила', h: `
<p>Главная ловушка дообучения — <b>переобучение</b> (overfitting): модель запоминает обучающие примеры вместо того, чтобы уловить закономерность. На своих примерах она почти не ошибается, на новых — ошибается часто.</p>
<h3>Как его увидеть</h3>
<table class="ml-t"><thead><tr><th>Training Loss</th><th>Validation Loss</th><th>Что это значит</th></tr></thead><tbody>
<tr><td>падает</td><td>падает</td><td>модель учится, продолжаем</td></tr>
<tr><td>падает</td><td>перестал падать или растёт</td><td>началось переобучение — пора остановиться</td></tr>
<tr><td>почти не падает</td><td>почти не падает</td><td>недообучение: мало эпох, слишком маленькая модель или шум в данных</td></tr></tbody></table>
<p>Поэтому на обучающие данные смотреть бессмысленно: правду говорит только <b>validation</b>.</p>
<h3>Что с этим делать</h3>
<ul><li><b>Остановиться вовремя</b> — взять модель той эпохи, где ошибка на проверке была наименьшей.</li>
<li><b>Добавить данных</b> — самое надёжное средство. Мы взяли 8 000 примеров из 45 000: попробуйте больше.</li>
<li><b>Меньше эпох и ниже скорость обучения.</b></li>
<li><b>Регуляризация</b> — параметр <code>weight_decay</code> уже стоит в нашем примере.</li></ul>
<p>Ранняя остановка делается в три строки:</p>` + code(`
from transformers import EarlyStoppingCallback

args = TrainingArguments(
    output_dir="reviews-model",
    eval_strategy="epoch", save_strategy="epoch",
    load_best_model_at_end=True,          # в конце вернуть лучшую эпоху
    metric_for_best_model="eval_loss", greater_is_better=False,
    num_train_epochs=10, learning_rate=5e-5,
    per_device_train_batch_size=32, weight_decay=0.01, report_to="none",
)
trainer = Trainer(
    model=model, args=args, train_dataset=train, eval_dataset=val,
    data_collator=DataCollatorWithPadding(tok), compute_metrics=metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],   # две эпохи без улучшения — стоп
)
trainer.train()
`) + `<h3>Итоговая оценка</h3>
<p>Когда всё настроено, один раз проверяем на отложенной части <b>test</b>:</p>` + code(`
print(trainer.evaluate(ds_tok["test"]))
`) + `<p>Одной точности мало. Если 90% отзывов положительные, модель, которая всегда отвечает «положительный», наберёт 90% — и будет бесполезна. Смотрите ошибки по каждому классу и читайте примеры, на которых модель ошиблась.</p>` + note('<b>Задание.</b> Обучите модель на 500 примерах и 10 эпохах без ранней остановки. Выпишите Training Loss и Validation Loss по эпохам и найдите эпоху, с которой началось переобучение.') },
      { t: 'Сохранить, поделиться и что дальше', h: `
<h3>Сохранить модель</h3>` + code(`
trainer.save_model("reviews-model/final")
tok.save_pretrained("reviews-model/final")

# позже — загрузить и пользоваться, уже без обучения
from transformers import pipeline
clf = pipeline("text-classification", model="reviews-model/final")
`) + `<p>Папку можно скачать из Colab и запускать на обычном компьютере: такая маленькая модель работает и без видеокарты.</p>
<h3>Выложить на Hub</h3>
<p>Если хотите показать модель в портфолио, зарегистрируйтесь на huggingface.co, создайте токен с правом записи и выполните:</p>` + code(`
from huggingface_hub import notebook_login
notebook_login()                      # вставить токен

trainer.model.push_to_hub("reviews-ru-tiny")
tok.push_to_hub("reviews-ru-tiny")
`) + `<p>Напишите карточку модели: на чём обучена, какая точность на test, где ошибается. Честная карточка ценится больше высокой цифры.</p>
<h3>Куда двигаться дальше</h3>
<ul><li><a href="https://huggingface.co/learn/llm-course" target="_blank" rel="noopener">Hugging Face LLM Course</a> — полный курс, с которого взята структура этого: дообучение больших моделей, собственные токенизаторы, демо-приложения.</li>
<li><a href="https://huggingface.co/learn/agents-course" target="_blank" rel="noopener">Agents Course</a> — как строить ИИ-агентов.</li>
<li><a href="https://github.com/microsoft/AI-For-Beginners" target="_blank" rel="noopener">Microsoft AI for Beginners</a> — основы машинного обучения, 24 урока.</li></ul>
<p>Все три — на английском и бесплатны.</p>` + note('<b>Итоговое задание курса.</b> Возьмите свою задачу на классификацию: обращения, отзывы, письма. Соберите и обезличьте 300–500 примеров, разметьте их, дообучите <code>rubert-tiny2</code> и запишите точность на отложенных 20%. Это готовая работа для портфолио.') }
    ], quiz: [
      { q: 'Training Loss падает, а Validation Loss растёт. Что происходит?', o: ['Модель учится всё лучше', 'Переобучение: модель зубрит обучающие примеры', 'Сломалась видеокарта'], a: 1, e: 'Правду говорит validation. Пора остановиться и взять модель лучшей эпохи.' },
      { q: 'Самое надёжное средство от переобучения?', o: ['Больше эпох', 'Больше разнообразных данных', 'Модель побольше'], a: 1, e: 'Больше эпох и больше модель переобучение только усиливают.' },
      { q: '95% отзывов положительные, точность модели — 95%. Модель хорошая?', o: ['Да', 'Неизвестно: столько же наберёт модель, которая всегда отвечает «положительный»', 'Нет, нужно 100%'], a: 1, e: 'При перекосе классов смотрят ошибки по каждому классу, а не общую точность.' }
    ] }
  ];

  // плоский список шагов: уроки и тесты
  var STEPS = [];
  CH.forEach(function (c, ci) {
    c.lessons.forEach(function (l, li) { STEPS.push({ ci: ci, title: l.t, html: l.h, n: ci + '.' + (li + 1) }); });
    if (c.quiz) STEPS.push({ ci: ci, title: 'Тест по главе', quiz: c.quiz });
  });
  var KEY = 'uii-ml', st = { cur: 0, done: {}, quiz: {} };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) st = sv; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  function renderNav() {
    var i = 0;
    $('ml-nav').innerHTML = CH.map(function (c, ci) {
      var items = STEPS.filter(function (s) { return s.ci === ci; }).map(function (s) {
        var idx = i++;
        return '<li><button type="button" data-step="' + idx + '"' + (idx === st.cur ? ' aria-current="step"' : '') + ' class="' + (st.done[idx] ? 'done' : '') + '">' +
          '<i>' + (st.done[idx] ? '✓' : (s.quiz ? '?' : '')) + '</i>' + esc(s.title) + '</button></li>';
      }).join('');
      return '<div class="ml-ch"><b>' + (ci ? 'Глава ' + ci + '. ' : '') + esc(c.t) + '</b><ul>' + items + '</ul></div>';
    }).join('');
    var d = Object.keys(st.done).length;
    $('ml-bar').style.width = Math.round(d / STEPS.length * 100) + '%';
    $('ml-prog').textContent = d + ' из ' + STEPS.length;
  }
  function renderQuiz(s) {
    var ans = st.quiz[st.cur] || {};
    return '<p>Три вопроса по главе. Объяснение появится сразу после ответа.</p>' + s.quiz.map(function (x, i) {
      var a = ans[i];
      return '<div class="qq"><p class="qq-q"><span>' + (i + 1) + '</span>' + esc(x.q) + '</p><div class="qq-o">' + x.o.map(function (o, j) {
        var cls = a == null ? '' : (j === x.a ? ' right' : (j === a ? ' wrong' : ''));
        return '<button type="button" class="qo' + cls + '" data-q="' + i + '" data-o="' + j + '"' + (a != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
      }).join('') + '</div>' + (a != null ? '<p class="qq-e">' + esc(x.e) + '</p>' : '') + '</div>';
    }).join('');
  }
  function render() {
    var s = STEPS[st.cur], c = CH[s.ci];
    $('ml-body').innerHTML = '<span class="kicker">' + (s.ci ? 'Глава ' + s.ci + ' · ' : '') + esc(c.t) + '</span><h2>' + esc(s.title) + '</h2>' +
      (s.quiz ? renderQuiz(s) : s.html + '<p class="ml-colab"><a class="btn sm ghost" href="https://colab.new" target="_blank" rel="noopener">Открыть новую тетрадь Colab ↗</a></p>');
    $('ml-prev').disabled = st.cur === 0;
    $('ml-next').textContent = st.cur === STEPS.length - 1 ? 'Завершить курс ✓' : 'Дальше →';
    $('ml-finish').hidden = true;
    renderNav();
  }
  function go(i) { st.cur = Math.max(0, Math.min(STEPS.length - 1, i)); save(); render(); $('ml').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  $('ml-nav').addEventListener('click', function (e) { var b = e.target.closest('[data-step]'); if (b) go(+b.getAttribute('data-step')); });
  $('ml-prev').onclick = function () { go(st.cur - 1); };
  $('ml-next').onclick = function () {
    st.done[st.cur] = true; save();
    if (st.cur === STEPS.length - 1) { renderNav(); $('ml-finish').hidden = false; $('ml-finish').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else go(st.cur + 1);
  };
  $('ml-body').addEventListener('click', function (e) {
    var cp = e.target.closest('.code-copy'), q = e.target.closest('[data-o]');
    if (cp) {
      var text = cp.parentNode.querySelector('code').textContent;
      var ok = function () { cp.textContent = 'Скопировано ✓'; setTimeout(function () { cp.textContent = 'Скопировать'; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, function () {}); else ok();
    }
    if (q && !q.disabled) {
      st.quiz[st.cur] = st.quiz[st.cur] || {};
      st.quiz[st.cur][q.getAttribute('data-q')] = +q.getAttribute('data-o'); save(); render();
    }
  });
  render();
})();
