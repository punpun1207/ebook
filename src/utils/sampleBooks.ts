import { Book } from '../types';
import { parseContentToParagraphs } from './textProcessor';

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'sample-hoang-tu-be',
    title: 'Hoàng Tử Bé (Le Petit Prince)',
    author: 'Antoine de Saint-Exupéry',
    format: 'sample',
    language: 'vi',
    totalChapters: 3,
    totalWords: 0,
    chapters: [
      {
        id: 'htb-c1',
        index: 0,
        title: 'Chương 1: Bức tranh con trăn nuốt voi',
        paragraphs: parseContentToParagraphs(
          `Năm lên sáu tuổi, có một lần tôi nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách viết về Rừng nguyên sinh có tên là "Những câu chuyện có thật". Bức vẽ thể hiện một con trăn lớn đang nuốt chửng một con thú hoang dã.\n\n` +
          `Cuốn sách đó viết rằng: "Các con trăn nuốt chửng con mồi mà không cần nhai. Sau đó chúng không thể di chuyển được nữa và ngủ li bì suốt sáu tháng trời để tiêu hóa con mồi."\n\n` +
          `Tôi liền suy ngẫm rất nhiều về những chuyến phiêu lưu kỳ thú trong rừng thẳm nhiệt đới, và với một cây bút chì màu, tôi đã vẽ thành công bức vẽ đầu tiên trong đời mình. Đó là Bức vẽ Số 1 của tôi.\n\n` +
          `Tôi đem kiệt tác này khoe với người lớn và hỏi xem bức tranh có làm cho họ sợ không. Thế nhưng họ lại trả lời tôi rằng: "Tại sao một cái mũ lại có thể làm ai sợ được chứ?"\n\n` +
          `Bức vẽ của tôi đâu phải là một cái mũ. Đó là hình một con trăn khổng lồ đang tiêu hóa một con voi bên trong bụng nó. Thế rồi, để cho người lớn có thể hiểu rõ, tôi bèn vẽ thêm mặt trong của con trăn. Người lớn lúc nào cũng cần được giải thích cặn kẽ mọi điều.`,
          0
        ),
        wordCount: 0,
      },
      {
        id: 'htb-c2',
        index: 1,
        title: 'Chương 2: Gặp gỡ trên sa mạc Sahara',
        paragraphs: parseContentToParagraphs(
          `Cứ như thế, tôi sống cô độc một mình, không có lấy một ai để thực sự chuyện trò tâm sự, cho tới khi máy bay của tôi gặp sự cố và rơi xuống sa mạc Sahara cách đây sáu năm. Một thứ gì đó trong động cơ của tôi đã bị vỡ. Và vì tôi không mang theo thợ máy hay hành khách nào, tôi đành phải tự mình xoay xở với một ca sửa chữa vô cùng khó khăn.\n\n` +
          `Đó là một câu chuyện sinh tử đối với tôi: tôi chỉ có đủ nước uống để cầm cự trong đúng tám ngày.\n\n` +
          `Đêm đầu tiên, tôi ngủ thiếp đi trên bãi cát hoang vu, cách xa mọi chốn có con người hàng nghìn dặm. Tôi cảm thấy mình còn cô độc hơn cả một người đắm tàu lênh đênh trên chiếc bè giữa đại dương bao la. Bởi vậy, các bạn hãy tưởng tượng nỗi kinh ngạc to lớn của tôi, khi vừa rạng đông, một giọng nói kỳ lạ bé nhỏ đã đánh thức tôi dậy:\n\n` +
          `"Làm ơn... hãy vẽ cho tôi một con cừu!"\n\n` +
          `"Cái gì cơ?"\n\n` +
          `"Vẽ cho tôi một con cừu đi mà!"\n\n` +
          `Tôi bật dậy như bị sét đánh trúng. Tôi dụi mắt thật kỹ rồi nhìn chăm chú xung quanh. Và tôi thấy một cậu bé phi thường đang nghiêm trang ngắm nhìn tôi.`,
          1
        ),
        wordCount: 0,
      },
      {
        id: 'htb-c3',
        index: 2,
        title: 'Chương 21: Bí mật của con Cáo và sự cảm hóa',
        paragraphs: parseContentToParagraphs(
          `Đúng lúc ấy thì con cáo xuất hiện.\n\n` +
          `"Xin chào," con cáo nói.\n\n` +
          `"Xin chào," hoàng tử bé lịch sự đáp lời rồi quay người lại nhưng chẳng thấy ai.\n\n` +
          `"Tôi ở đây," giọng nói cất lên, "dưới gốc cây táo..."\n\n` +
          `"Bạn là ai thế?" hoàng tử bé hỏi. "Trông bạn thật xinh xắn..."\n\n` +
          `"Tôi là một con cáo," nó trả lời.\n\n` +
          `"Hãy lại đây chơi với tôi đi," hoàng tử bé đề nghị. "Tôi đang buồn quá..."\n\n` +
          `"Tôi không thể chơi với bạn được," con cáo nói. "Tôi chưa được cảm hóa."\n\n` +
          `"A! Xin lỗi bạn," hoàng tử bé ngập ngừng. Nhưng sau một thoáng suy nghĩ, cậu hỏi thêm: "Cảm hóa nghĩa là gì thế?"\n\n` +
          `"Đó là một khái niệm đã bị lãng quên từ lâu," con cáo giải thích. "Nó có nghĩa là 'tạo dựng mối dây ràng buộc'."\n\n` +
          `"Tạo dựng mối dây ràng buộc ư?"\n\n` +
          `"Đúng vậy," con cáo nói. "Đối với tôi, hiện giờ bạn chỉ là một cậu bé giống như hàng trăm nghìn cậu bé khác. Và tôi chẳng có nhu cầu gì cần đến bạn cả. Bạn cũng chẳng cần gì đến tôi. Đối với bạn, tôi chỉ là một con cáo giống như hàng trăm nghìn con cáo khác. Nhưng nếu bạn cảm hóa tôi, hai chúng ta sẽ cần đến nhau. Với tôi, bạn sẽ là duy nhất trên trần đời. Với bạn, tôi cũng sẽ là duy nhất trên trần đời..."`,
          2
        ),
        wordCount: 0,
      },
    ],
    dateAdded: Date.now(),
    lastReadChapter: 0,
    lastReadParagraph: 0,
    lastReadSentence: 0,
  },
  {
    id: 'sample-de-men',
    title: 'Dế Mèn Phiêu Lưu Ký',
    author: 'Tô Hoài',
    format: 'sample',
    language: 'vi',
    totalChapters: 2,
    totalWords: 0,
    chapters: [
      {
        id: 'dm-c1',
        index: 0,
        title: 'Chương 1: Bài học đường đời đầu tiên',
        paragraphs: parseContentToParagraphs(
          `Tôi sống độc lập từ thuở bé. Ấy là tục lệ lâu đời trong họ nhà dế chúng tôi. Mẹ tôi chỉ nuôi nấng chúng tôi ba hôm. Đến hôm thứ ba, mẹ dẫn cả đàn con ra đồng, chia cho mỗi đứa một cái hang đất con bên bờ cỏ rậm rạp rồi bỏ về. Đứa nào khỏe mạnh, nhanh nhẹn thì tự bới đất đào sâu thêm mà ở; đứa nào yếu ớt, lười biếng thì đành chịu chết đói.\n\n` +
          `Bởi tôi ăn uống điều độ và làm việc có chừng mực nên tôi chóng lớn lắm. Chẳng bao lâu, tôi đã trở thành một chàng dế thanh niên cường tráng.\n\n` +
          `Đôi càng tôi mẫm bóng. Những cái vuốt ở chân, ở khoeo cứ cứng dần và nhọn hoắt. Thỉnh thoảng, muốn thử sự lợi hại của những chiếc vuốt, tôi co cẳng lên, đạp phanh phách vào các ngọn cỏ. Những ngọn cỏ gãy rạp, y như có nhát dao vừa lia qua.\n\n` +
          `Đôi cánh tôi trước kia ngắn hủn hoẳn, bây giờ đã phát triển thành chiếc áo dài kín chấm đuôi. Mỗi khi tôi cử động, đôi cánh rung rinh lên những tiếng reo ròn rã, nghe rất vui tai.`,
          0
        ),
        wordCount: 0,
      },
      {
        id: 'dm-c2',
        index: 1,
        title: 'Chương 2: Tính tự phụ và nỗi ân hận muộn màng',
        paragraphs: parseContentToParagraphs(
          `Tôi rất thích đi dạo mát trong những buổi chiều êm ả. Tôi đứng trên một tảng đá phẳng phiu ven bờ đầm nước, đưa mắt nhìn quanh quất bốn bề. Tôi ngước nhìn bầu trời trong vắt, ngắm những đám mây ngũ sắc lững lờ trôi, rồi tự đắc nghĩ rằng trong vùng này chẳng có gã nào oai vệ và dũng cảm bằng tôi.\n\n` +
          `Cạnh hang tôi ở có anh Dế Choắt. Choắt là tên tôi đặt cho hắn một cách chế giễu và xấc xược như thế. Dế Choắt người gầy gò, ốm yếu và dài lêu nghêu như một gã nghiện thuốc phiện. Cánh hắn ngắn củn đến giữa lưng, hở cả sườn như người cởi trần mặc áo gi-lê. Đôi càng bè bè, nặng nề, trông đến phát chán.\n\n` +
          `Mỗi lần gặp tôi, Choắt đều cúi đầu lễ phép: "Em chào anh Mèn ạ!" Tôi chỉ khinh khỉnh hất râu đáp lại mà không thèm quay mặt nhìn. Tôi đâu ngờ rằng chính tính kiêu ngạo nông nổi ấy sắp sửa dẫn đến một tai họa không thể nào cứu vãn được.`,
          1
        ),
        wordCount: 0,
      },
    ],
    dateAdded: Date.now() - 3600000,
    lastReadChapter: 0,
    lastReadParagraph: 0,
    lastReadSentence: 0,
  },
  {
    id: 'sample-doc-sach-tts',
    title: 'Nghệ Thuật Lắng Nghe & Đọc Sách Sâu',
    author: 'Tủ Sách Tri Thức',
    format: 'sample',
    language: 'vi',
    totalChapters: 1,
    totalWords: 0,
    chapters: [
      {
        id: 'ds-c1',
        index: 0,
        title: 'Âm thanh của con chữ và khả năng tập trung',
        paragraphs: parseContentToParagraphs(
          `Trong thời đại số với vô vàn thông tin phân mảnh, khả năng lắng nghe một cuốn sách từ đầu đến cuối là một kỹ năng rèn luyện tâm trí vô giá. Khác với việc đọc lướt bằng mắt trên màn hình điện thoại, âm thanh giọng đọc dẫn dắt tâm trí theo từng nhịp thở, từng dấu phẩy và từng khoảng lặng suy tư.\n\n` +
          `Một giọng đọc Text-to-Speech được xem là mạch lạc khi nó không đơn thuần là phát âm chuẩn xác từng chữ cái ghép lại, mà phải biết giữ nhịp: ngừng nghỉ tự nhiên ở cuối câu khoảng 250 đến 400 mili-giây, giãn cách giữa các đoạn văn để người nghe kịp thẩm thấu ý nghĩa, và xử lý mượt mà các từ viết tắt như PGS.TS, TP.HCM, hay các con số phần trăm.\n\n` +
          `Khi tai nghe giọng đọc và mắt dõi theo dòng chữ đang được tô sáng nhịp nhàng, hai giác quan thị giác và thính giác cộng hưởng với nhau, giúp não bộ ghi nhớ sâu hơn gấp 2.5 lần so với việc tiếp nhận thụ động.\n\n` +
          `Hãy tận hưởng cuốn sách của bạn bằng cách chọn một chất giọng êm tai, điều chỉnh tốc độ vừa vặn với thói quen, và để tri thức dẫn lối cho tâm hồn.`,
          0
        ),
        wordCount: 0,
      },
    ],
    dateAdded: Date.now() - 7200000,
    lastReadChapter: 0,
    lastReadParagraph: 0,
    lastReadSentence: 0,
  },
];

// Initialize word counts
SAMPLE_BOOKS.forEach((book) => {
  let totalW = 0;
  book.chapters.forEach((chap) => {
    chap.wordCount = chap.paragraphs.reduce(
      (sum, p) => sum + p.rawText.split(/\s+/).filter(Boolean).length,
      0
    );
    totalW += chap.wordCount;
  });
  book.totalWords = totalW;
});
