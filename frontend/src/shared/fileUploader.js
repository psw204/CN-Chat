/**
 * 파일을 Base64 문자열로 변환 (최대 1MB 제한)
 * @param {File} file
 * @returns {Promise<string>} Base64 문자열
 */
const uploadFileAsBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 1024 * 1024) {
      reject("1MB 이하의 파일만 업로드할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default uploadFileAsBase64;
