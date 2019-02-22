// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {PathLayer} from '@deck.gl/layers';

const uniformToInject = `\
uniform float trailLength;
uniform float currentTime;
`;

const varyingToInject = `\
varying float vTime;
varying float completion;
varying float xPosition;
`;

const fragmentShaderToInject = `\
if(vTime > 1.0 || vTime < 0.0) {
  discard;
}

if(xPosition > completion){
  discard;
}
`;

const vertexShaderToInject = `\
vec4 shift = vec4(0., 0., mod(instanceEndPositions.z, trailLength) * 1e-4, 0.);
gl_Position = project_to_clipspace(vec4(pos.xy, 1.0, 1.0)) + shift;
vTime = 1.0 - (currentTime - instanceStartPositions.z) / trailLength;
completion = clamp((currentTime - instanceStartPositions.z) / (instanceEndPositions.z - instanceStartPositions.z), 0.0, 1.0);
xPosition = positions.x;
`;

export default class DynamicPathLayer extends PathLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#decl': `${uniformToInject}\n${varyingToInject}`,
      'vs:#main-end': vertexShaderToInject,
      'fs:#decl': varyingToInject,
      'fs:#main-start': fragmentShaderToInject,
      'gl_FragColor = vColor;': 'gl_FragColor = vec4(gl_FragColor.rgb, gl_FragColor.a * vTime);'
    };
    return shaders;
  }

  draw({uniforms}) {
    const {
      rounded,
      miterLimit,
      widthScale,
      widthMinPixels,
      widthMaxPixels,
      dashJustified,
      trailLength,
      currentTime
    } = this.props;

    this.state.model.render(
      Object.assign({}, uniforms, {
        jointType: Number(rounded),
        alignMode: Number(dashJustified),
        widthScale,
        miterLimit,
        widthMinPixels,
        widthMaxPixels,
        trailLength,
        currentTime
      })
    );
  }
}
