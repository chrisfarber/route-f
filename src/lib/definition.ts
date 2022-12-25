/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface Route<Path extends string = any, Params extends Record<never, never> = any> {
  path: Path;
  _params: Params;
  match(input: string): MatchResult<Params>;
  make(params: Params): string;
}

type ParamsOf<R extends Route> = R["_params"];

type MatchError = { error: true; description?: string };
type MatchSuccess<P> = { error: false; params: P; remaining: string };
type MatchResult<P> = MatchError | MatchSuccess<P>;

type SubPath<Path extends string, Sub extends string> = `${LeadingSlash<Path>}${LeadingSlash<Sub>}`;
type PathOf<R extends Route> = R["path"];

type StripLeadingSlash<S extends string> = S extends `/${infer R}` ? StripLeadingSlash<R> : S;
type LeadingSlash<S extends string> = `/${StripLeadingSlash<S>}`;

// export const pathSegments = <Rs extends Route[]>(...segments: Rs): ConcatRoutes<Rs> => {};

export const text = <T extends string>(text: T): Route<T, Record<never, never>> => {
  return {
    _params: null as any,
    path: text,
    match(input) {
      if (input.startsWith(text)) {
        return { error: false, params: {}, remaining: input.substring(text.length) };
      } else {
        return { error: true, description: `expected "${text}", found: "${input}"` };
      }
    },
    make(params) {
      return text;
    },
  };
};

// TODO this regexp is broken
const stringParamRegexp = /^[0-9A-Za-z_\\-]+/;
/** Matches the input text until one of the following characters are encountered: "/?#". Extracts
 * the value into the supplied params. */
export const stringParam = <K extends string>(key: K): Route<`:${K}`, Record<K, string>> => {
  return {
    _params: null as any,
    path: `:${key}`,
    match(input) {
      const match = input.match(stringParamRegexp);
      if (!match) {
        return {
          error: true,
          description: `expected to find string param ":${key}", found: "${input}"`,
        };
      }
      const [found] = match;
      return {
        error: false,
        params: { [key]: found } as Record<K, string>,
        remaining: input.substring(found.length),
      };
    },
    make(params) {
      return params[key];
    },
  };
};

type ConcatenatedRoutes<Rs extends Route[]> = Rs extends [
  infer R extends Route,
  infer R2 extends Route,
  ...infer Rest extends Route[],
]
  ? ConcatenatedRoutes<[Route<`${R["path"]}${R2["path"]}`, R["_params"] & R2["_params"]>, ...Rest]>
  : Rs[0];
export const concat = <Rs extends Route[]>(...routes: Rs): ConcatenatedRoutes<Rs> => {
  const route: Route<any, any> = {
    _params: null as any,
    path: routes.map(r => r.path).join("") as any,
    match(input: string) {
      let remaining = input;
      let params: Record<string, any> = {};
      for (const r of routes) {
        const matched = r.match(remaining);
        if (matched.error) {
          return matched;
        }
        remaining = matched.remaining;
        params = { ...params, ...matched.params };
      }
      return { error: false, params, remaining };
    },
    make(params) {
      return routes.map(r => r.make(params)).join("");
    },
  };

  return route as any;
};

type RouteOrText = Route | string;
type RouteOrTextToRoute<R extends RouteOrText> = R extends string ? Route<R, Record<never, never>> : R;
type PathConcatenatedRoutes<Rs extends RouteOrText[]> = Rs extends [
  infer R extends RouteOrText,
  infer R2 extends RouteOrText,
  ...infer Rest extends RouteOrText[],
]
  ? PathConcatenatedRoutes<
      [
        Route<
          `${RouteOrTextToRoute<R>["path"]}${RouteOrTextToRoute<R2>["path"]}`,
          RouteOrTextToRoute<R>["_params"] & RouteOrTextToRoute<R2>["_params"]
        >,
        ...Rest,
      ]
    >
  : Rs[0];
export const path = <Rs extends RouteOrText[]>(...routes: Rs): PathConcatenatedRoutes<Rs> => {
  return null as any;
};

// const wat = [{ hi: "true" }, { hi: "false" }] as const;
// type Wat = typeof wat;
// type Wat2 = { [K in keyof Wat]: Wat[K] | null };

// export const path = <Rs extends Route[]>(...routes: Rs): ConcatenatedRoutes<Rs> => {};

const other = path("hello", "there", "stuff");
// path(other, stringParam("stuff"));

// ("/hello/there/stuff/:stuff");
