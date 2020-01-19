<template>
  <div class='absolute no-webgl'>
    <h3>WebGL is not enabled :(</h3>
    <p>This website renders millions of roads at once.</p>
    <p>
      To render this amount of data fast, the website uses <a href='https://get.webgl.org/'>WebGL</a>,
      which seem to be not supported by the device that you are using.
    </p>
    <p>Please try a different device to play with this website</p>
    <img src="https://i.imgur.com/Fbbe5a6.png" alt="demo">
  </div>
</template>
<style lang="stylus" scoped>

  .no-webgl {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px auto;
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    padding: 8px;
h3 {
  font-weight: normal;
  font-size: 32px;
  margin: 16px;
}
p {
  max-width: 400px;
  margin: 8px 0;
}
img {
  width: 100%;
  max-width: 1440px;
}
  }
</style>