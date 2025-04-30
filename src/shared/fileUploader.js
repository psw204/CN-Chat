// 파일을 Base64 문자열로 변환 (최대 1MB)
const uploadFileAsBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 1024 * 1024) {
      reject("파일 크기는 1MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject("파일 읽기 오류: " + error);
  });
};

export default uploadFileAsBase64;
