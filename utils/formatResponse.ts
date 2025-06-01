export function formatResponse(res: any) {
  try {
    return JSON.stringify({
      result: res.result,
      response: {
        status: res.response?.status,
        ok: res.response?.ok,
      },
    });
  } catch (error) {

    return res;
  }
}
