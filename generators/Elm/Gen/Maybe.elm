module Elm.Gen.Maybe exposing (andThen, id_, make_, map, map2, map3, map4, map5, moduleName_, types_, withDefault)

{-| 
-}


import Elm
import Elm.Annotation as Type


{-| The name of this module. -}
moduleName_ : List String
moduleName_ =
    [ "Maybe" ]


types_ : { maybe : Type.Annotation -> Type.Annotation }
types_ =
    { maybe = \arg0 -> Type.namedWith moduleName_ "Maybe" [ arg0 ] }


make_ :
    { maybe :
        { just : Elm.Expression -> Elm.Expression, nothing : Elm.Expression }
    }
make_ =
    { maybe =
        { just =
            \ar0 ->
                Elm.apply
                    (Elm.valueWith
                        moduleName_
                        "Just"
                        (Type.namedWith [] "Maybe" [ Type.var "a" ])
                    )
                    [ ar0 ]
        , nothing =
            Elm.valueWith
                moduleName_
                "Nothing"
                (Type.namedWith [] "Maybe" [ Type.var "a" ])
        }
    }


{-| Provide a default value, turning an optional value into a normal
value.  This comes in handy when paired with functions like
[`Dict.get`](Dict#get) which gives back a `Maybe`.

    withDefault 100 (Just 42)   -- 42
    withDefault 100 Nothing     -- 100

    withDefault "unknown" (Dict.get "Tom" Dict.empty)   -- "unknown"

**Note:** This can be overused! Many cases are better handled by a `case`
expression. And if you end up using `withDefault` a lot, it can be a good sign
that a [custom type][ct] will clean your code up quite a bit!

[ct]: https://guide.elm-lang.org/types/custom_types.html
-}
withDefault : Elm.Expression -> Elm.Expression -> Elm.Expression
withDefault arg1 arg2 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "withDefault"
            (Type.function
                [ Type.var "a", Type.maybe (Type.var "a") ]
                (Type.var "a")
            )
        )
        [ arg1, arg2 ]


{-| Transform a `Maybe` value with a given function:

    map sqrt (Just 9) == Just 3
    map sqrt Nothing  == Nothing

    map sqrt (String.toFloat "9") == Just 3
    map sqrt (String.toFloat "x") == Nothing

-}
map : (Elm.Expression -> Elm.Expression) -> Elm.Expression -> Elm.Expression
map arg1 arg2 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "map"
            (Type.function
                [ Type.function [ Type.var "a" ] (Type.var "b")
                , Type.maybe (Type.var "a")
                ]
                (Type.maybe (Type.var "b"))
            )
        )
        [ arg1 Elm.pass, arg2 ]


{-| Apply a function if all the arguments are `Just` a value.

    map2 (+) (Just 3) (Just 4) == Just 7
    map2 (+) (Just 3) Nothing == Nothing
    map2 (+) Nothing (Just 4) == Nothing

    map2 (+) (String.toInt "1") (String.toInt "123") == Just 124
    map2 (+) (String.toInt "x") (String.toInt "123") == Nothing
    map2 (+) (String.toInt "1") (String.toInt "1.3") == Nothing
-}
map2 :
    (Elm.Expression -> Elm.Expression -> Elm.Expression)
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
map2 arg1 arg2 arg3 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "map2"
            (Type.function
                [ Type.function
                    [ Type.var "a", Type.var "b" ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                ]
                (Type.maybe (Type.var "value"))
            )
        )
        [ arg1 Elm.pass Elm.pass, arg2, arg3 ]


{-|-}
map3 :
    (Elm.Expression -> Elm.Expression -> Elm.Expression -> Elm.Expression)
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
map3 arg1 arg2 arg3 arg4 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "map3"
            (Type.function
                [ Type.function
                    [ Type.var "a", Type.var "b", Type.var "c" ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                , Type.maybe (Type.var "c")
                ]
                (Type.maybe (Type.var "value"))
            )
        )
        [ arg1 Elm.pass Elm.pass Elm.pass, arg2, arg3, arg4 ]


{-|-}
map4 :
    (Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression)
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
map4 arg1 arg2 arg3 arg4 arg5 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "map4"
            (Type.function
                [ Type.function
                    [ Type.var "a", Type.var "b", Type.var "c", Type.var "d" ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                , Type.maybe (Type.var "c")
                , Type.maybe (Type.var "d")
                ]
                (Type.maybe (Type.var "value"))
            )
        )
        [ arg1 Elm.pass Elm.pass Elm.pass Elm.pass, arg2, arg3, arg4, arg5 ]


{-|-}
map5 :
    (Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression)
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
    -> Elm.Expression
map5 arg1 arg2 arg3 arg4 arg5 arg6 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "map5"
            (Type.function
                [ Type.function
                    [ Type.var "a"
                    , Type.var "b"
                    , Type.var "c"
                    , Type.var "d"
                    , Type.var "e"
                    ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                , Type.maybe (Type.var "c")
                , Type.maybe (Type.var "d")
                , Type.maybe (Type.var "e")
                ]
                (Type.maybe (Type.var "value"))
            )
        )
        [ arg1 Elm.pass Elm.pass Elm.pass Elm.pass Elm.pass
        , arg2
        , arg3
        , arg4
        , arg5
        , arg6
        ]


{-| Chain together many computations that may fail. It is helpful to see its
definition:

    andThen : (a -> Maybe b) -> Maybe a -> Maybe b
    andThen callback maybe =
        case maybe of
            Just value ->
                callback value

            Nothing ->
                Nothing

This means we only continue with the callback if things are going well. For
example, say you need to parse some user input as a month:

    parseMonth : String -> Maybe Int
    parseMonth userInput =
        String.toInt userInput
          |> andThen toValidMonth

    toValidMonth : Int -> Maybe Int
    toValidMonth month =
        if 1 <= month && month <= 12 then
            Just month
        else
            Nothing

In the `parseMonth` function, if `String.toInt` produces `Nothing` (because
the `userInput` was not an integer) this entire chain of operations will
short-circuit and result in `Nothing`. If `toValidMonth` results in `Nothing`,
again the chain of computations will result in `Nothing`.
-}
andThen : (Elm.Expression -> Elm.Expression) -> Elm.Expression -> Elm.Expression
andThen arg1 arg2 =
    Elm.apply
        (Elm.valueWith
            moduleName_
            "andThen"
            (Type.function
                [ Type.function [ Type.var "a" ] (Type.maybe (Type.var "b"))
                , Type.maybe (Type.var "a")
                ]
                (Type.maybe (Type.var "b"))
            )
        )
        [ arg1 Elm.pass, arg2 ]


{-| Every value/function in this module in case you need to refer to it directly. -}
id_ :
    { withDefault : Elm.Expression
    , map : Elm.Expression
    , map2 : Elm.Expression
    , map3 : Elm.Expression
    , map4 : Elm.Expression
    , map5 : Elm.Expression
    , andThen : Elm.Expression
    }
id_ =
    { withDefault =
        Elm.valueWith
            moduleName_
            "withDefault"
            (Type.function
                [ Type.var "a", Type.maybe (Type.var "a") ]
                (Type.var "a")
            )
    , map =
        Elm.valueWith
            moduleName_
            "map"
            (Type.function
                [ Type.function [ Type.var "a" ] (Type.var "b")
                , Type.maybe (Type.var "a")
                ]
                (Type.maybe (Type.var "b"))
            )
    , map2 =
        Elm.valueWith
            moduleName_
            "map2"
            (Type.function
                [ Type.function
                    [ Type.var "a", Type.var "b" ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                ]
                (Type.maybe (Type.var "value"))
            )
    , map3 =
        Elm.valueWith
            moduleName_
            "map3"
            (Type.function
                [ Type.function
                    [ Type.var "a", Type.var "b", Type.var "c" ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                , Type.maybe (Type.var "c")
                ]
                (Type.maybe (Type.var "value"))
            )
    , map4 =
        Elm.valueWith
            moduleName_
            "map4"
            (Type.function
                [ Type.function
                    [ Type.var "a", Type.var "b", Type.var "c", Type.var "d" ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                , Type.maybe (Type.var "c")
                , Type.maybe (Type.var "d")
                ]
                (Type.maybe (Type.var "value"))
            )
    , map5 =
        Elm.valueWith
            moduleName_
            "map5"
            (Type.function
                [ Type.function
                    [ Type.var "a"
                    , Type.var "b"
                    , Type.var "c"
                    , Type.var "d"
                    , Type.var "e"
                    ]
                    (Type.var "value")
                , Type.maybe (Type.var "a")
                , Type.maybe (Type.var "b")
                , Type.maybe (Type.var "c")
                , Type.maybe (Type.var "d")
                , Type.maybe (Type.var "e")
                ]
                (Type.maybe (Type.var "value"))
            )
    , andThen =
        Elm.valueWith
            moduleName_
            "andThen"
            (Type.function
                [ Type.function [ Type.var "a" ] (Type.maybe (Type.var "b"))
                , Type.maybe (Type.var "a")
                ]
                (Type.maybe (Type.var "b"))
            )
    }


