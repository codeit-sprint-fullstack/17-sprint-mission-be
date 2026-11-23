export function notFound(_request, response) {
  response.status(404).json({ message: '요청한 API 경로를 찾을 수 없습니다.' })
}
