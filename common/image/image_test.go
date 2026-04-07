package image_test

import (
	"bytes"
	"encoding/base64"
	"fmt"
	stdimage "image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/yeying-community/router/common/client"
	img "github.com/yeying-community/router/common/image"
)

type imageFixture struct {
	name        string
	contentType string
	extension   string
	width       int
	height      int
	data        []byte
}

func TestMain(m *testing.M) {
	client.Init()
	m.Run()
}

func TestIsImageURL(t *testing.T) {
	server, fixtures := newImageTestServer(t)
	t.Run("image content type", func(t *testing.T) {
		ok, err := img.IsImageUrl(server.URL + "/" + fixtures[0].name)
		require.NoError(t, err)
		assert.True(t, ok)
	})
	t.Run("non image content type", func(t *testing.T) {
		ok, err := img.IsImageUrl(server.URL + "/not-image")
		require.NoError(t, err)
		assert.False(t, ok)
	})
}

func TestGetImageSizeFromURL(t *testing.T) {
	server, fixtures := newImageTestServer(t)
	for _, fixture := range fixtures {
		fixture := fixture
		t.Run(fixture.name, func(t *testing.T) {
			width, height, err := img.GetImageSizeFromUrl(server.URL + "/" + fixture.name)
			require.NoError(t, err)
			assert.Equal(t, fixture.width, width)
			assert.Equal(t, fixture.height, height)
		})
	}
}

func TestGetImageSizeFromBase64(t *testing.T) {
	for _, fixture := range buildFixtures(t) {
		fixture := fixture
		t.Run(fixture.name, func(t *testing.T) {
			encoded := base64.StdEncoding.EncodeToString(fixture.data)
			width, height, err := img.GetImageSizeFromBase64(encoded)
			require.NoError(t, err)
			assert.Equal(t, fixture.width, width)
			assert.Equal(t, fixture.height, height)
		})
	}
}

func TestGetImageSizeDataURL(t *testing.T) {
	for _, fixture := range buildFixtures(t) {
		fixture := fixture
		t.Run(fixture.name, func(t *testing.T) {
			dataURL := fmt.Sprintf(
				"data:%s;base64,%s",
				fixture.contentType,
				base64.StdEncoding.EncodeToString(fixture.data),
			)
			width, height, err := img.GetImageSize(dataURL)
			require.NoError(t, err)
			assert.Equal(t, fixture.width, width)
			assert.Equal(t, fixture.height, height)
		})
	}
}

func TestGetImageSizeRejectsNonImageURL(t *testing.T) {
	server, _ := newImageTestServer(t)
	width, height, err := img.GetImageSize(server.URL + "/not-image")
	require.NoError(t, err)
	assert.Zero(t, width)
	assert.Zero(t, height)
}

func newImageTestServer(t *testing.T) (*httptest.Server, []imageFixture) {
	t.Helper()
	fixtures := buildFixtures(t)
	mux := http.NewServeMux()
	for _, fixture := range fixtures {
		fixture := fixture
		path := "/" + fixture.name
		mux.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", fixture.contentType)
			if r.Method == http.MethodHead {
				return
			}
			_, _ = w.Write(fixture.data)
		})
	}
	mux.HandleFunc("/not-image", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		if r.Method == http.MethodHead {
			return
		}
		_, _ = w.Write([]byte("not an image"))
	})
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)
	return server, fixtures
}

func buildFixtures(t *testing.T) []imageFixture {
	t.Helper()
	return []imageFixture{
		newPNGFixture(t, "png", 12, 7),
		newJPEGFixture(t, "jpeg", 19, 11),
		newGIFFixture(t, "gif", 8, 13),
	}
}

func newPNGFixture(t *testing.T, name string, width int, height int) imageFixture {
	t.Helper()
	buffer := bytes.NewBuffer(nil)
	require.NoError(t, png.Encode(buffer, newRGBAImage(width, height)))
	return imageFixture{
		name:        name,
		contentType: "image/png",
		extension:   "png",
		width:       width,
		height:      height,
		data:        buffer.Bytes(),
	}
}

func newJPEGFixture(t *testing.T, name string, width int, height int) imageFixture {
	t.Helper()
	buffer := bytes.NewBuffer(nil)
	require.NoError(t, jpeg.Encode(buffer, newRGBAImage(width, height), nil))
	return imageFixture{
		name:        name,
		contentType: "image/jpeg",
		extension:   "jpeg",
		width:       width,
		height:      height,
		data:        buffer.Bytes(),
	}
}

func newGIFFixture(t *testing.T, name string, width int, height int) imageFixture {
	t.Helper()
	palette := []color.Color{
		color.RGBA{R: 255, A: 255},
		color.RGBA{G: 255, A: 255},
		color.RGBA{B: 255, A: 255},
	}
	paletted := stdimage.NewPaletted(stdimage.Rect(0, 0, width, height), palette)
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			paletted.SetColorIndex(x, y, uint8((x+y)%len(palette)))
		}
	}
	buffer := bytes.NewBuffer(nil)
	require.NoError(t, gif.Encode(buffer, paletted, nil))
	return imageFixture{
		name:        name,
		contentType: "image/gif",
		extension:   "gif",
		width:       width,
		height:      height,
		data:        buffer.Bytes(),
	}
}

func newRGBAImage(width int, height int) *stdimage.RGBA {
	img := stdimage.NewRGBA(stdimage.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, color.RGBA{
				R: uint8((x * 17) % 255),
				G: uint8((y * 29) % 255),
				B: uint8(((x + y) * 13) % 255),
				A: 255,
			})
		}
	}
	return img
}

func TestGetImageFromURL(t *testing.T) {
	server, fixtures := newImageTestServer(t)
	for _, fixture := range fixtures {
		fixture := fixture
		t.Run(fixture.name, func(t *testing.T) {
			mimeType, data, err := img.GetImageFromUrl(server.URL + "/" + fixture.name)
			require.NoError(t, err)
			assert.Equal(t, fixture.contentType, mimeType)
			assert.Equal(t, base64.StdEncoding.EncodeToString(fixture.data), data)
		})
	}
}

func TestGetImageFromDataURL(t *testing.T) {
	fixture := buildFixtures(t)[0]
	dataURL := fmt.Sprintf(
		"data:%s;base64,%s",
		fixture.contentType,
		base64.StdEncoding.EncodeToString(fixture.data),
	)
	mimeType, data, err := img.GetImageFromUrl(dataURL)
	require.NoError(t, err)
	assert.Equal(t, fixture.contentType, mimeType)
	assert.Equal(t, base64.StdEncoding.EncodeToString(fixture.data), data)
}

func TestGetImageFromURLRejectsNonImage(t *testing.T) {
	server, _ := newImageTestServer(t)
	mimeType, data, err := img.GetImageFromUrl(server.URL + "/not-image")
	require.NoError(t, err)
	assert.True(t, strings.TrimSpace(mimeType) == "")
	assert.True(t, strings.TrimSpace(data) == "")
}
