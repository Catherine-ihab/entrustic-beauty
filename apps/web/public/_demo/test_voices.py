import asyncio, edge_tts
async def main():
    text = 'عايزة تحطي كل حاجة لعيادة التجميل في مكان واحد؟ ده إنترستيك بيوتي.'
    for r in ['-10%', '-8%', '-6%', '-4%']:
        c = edge_tts.Communicate(text, 'ar-EG-SalmaNeural', rate=r, pitch='-2Hz')
        await c.save('test_sal_' + r.replace('%','p') + '.mp3')
    print('done')
asyncio.run(main())
